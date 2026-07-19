import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

export type ExtractedField = {
  fieldCode: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number;
  pageNumber: number | null;
  boundingBox: unknown;
  warnings: string[];
};

export type StructuredExtraction = {
  documentType: string;
  detectedDocumentType: string;
  documentTypeConfidence: number;
  language: string | null;
  rawText: string | null;
  fields: ExtractedField[];
  missingFields: string[];
  warnings: string[];
  providerRequestId: string | null;
};

@Injectable()
export class CloudflareDocumentAdapter {
  configured() {
    return (
      process.env.DOCUMENT_EXTRACTION_PROVIDER === 'CLOUDFLARE_WORKERS_AI' &&
      Boolean(
        process.env.CLOUDFLARE_ACCOUNT_ID?.trim() &&
        process.env.CLOUDFLARE_API_TOKEN?.trim() &&
        process.env.CLOUDFLARE_AI_GATEWAY_ID?.trim(),
      )
    );
  }

  async extract(input: {
    buffer: Buffer;
    mimeType: string;
    documentType: string;
    requestedFields: string[];
  }) {
    if (!this.configured())
      throw new ServiceUnavailableException(
        'Cloudflare Workers AI document extraction is not configured.',
      );
    if (input.mimeType === 'application/pdf') {
      throw new BadRequestException(
        'PDF extraction requires a page-to-image adapter; upload a supported document image until that adapter is configured.',
      );
    }
    const model = process.env.CLOUDFLARE_DOCUMENT_VISION_MODEL?.trim();
    if (!model)
      throw new ServiceUnavailableException(
        'CLOUDFLARE_DOCUMENT_VISION_MODEL is not configured.',
      );
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!.trim();
    const gatewayId = process.env.CLOUDFLARE_AI_GATEWAY_ID!.trim();
    const endpoint = `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(accountId)}/${encodeURIComponent(gatewayId)}/workers-ai/${model}`;
    const timeoutMs = this.envNumber('DOCUMENT_EXTRACTION_TIMEOUT_MS', 60_000);
    const maxRetries = Math.min(
      this.envNumber('DOCUMENT_EXTRACTION_MAX_RETRIES', 2),
      3,
    );
    let lastStatus = 0;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN!.trim()}`,
            'cf-aig-authorization': `Bearer ${process.env.CLOUDFLARE_AI_GATEWAY_TOKEN?.trim() || process.env.CLOUDFLARE_API_TOKEN!.trim()}`,
            'cf-aig-collect-log-payload': 'false',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content:
                  'Return strict JSON only. Extract evidence; never approve an organization. Preserve raw values and use null when uncertain.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  documentType: input.documentType,
                  requestedFields: input.requestedFields,
                  image: `data:${input.mimeType};base64,${input.buffer.toString('base64')}`,
                  outputSchema: {
                    documentType: 'string',
                    detectedDocumentType: 'string',
                    documentTypeConfidence: '0..1',
                    language: 'string|null',
                    rawText: 'string|null',
                    fields: [
                      {
                        fieldCode: 'string',
                        rawValue: 'string|null',
                        normalizedValue: 'string|null',
                        confidence: '0..1',
                        pageNumber: 'number|null',
                        boundingBox: 'object|null',
                        warnings: ['string'],
                      },
                    ],
                    missingFields: ['string'],
                    warnings: ['string'],
                  },
                }),
              },
            ],
          }),
          signal: controller.signal,
        });
        lastStatus = response.status;
        if (!response.ok) {
          if (response.status < 500 && response.status !== 429)
            throw new BadRequestException(
              `Cloudflare extraction rejected the request (${response.status}).`,
            );
          if (attempt < maxRetries) continue;
          throw new ServiceUnavailableException(
            'Cloudflare extraction is temporarily unavailable.',
          );
        }
        const body = (await response.json()) as Record<string, unknown>;
        return {
          result: this.validate(body, input.documentType),
          model,
          providerRequestId: response.headers.get('cf-ray'),
        };
      } catch (error) {
        if (error instanceof BadRequestException || attempt >= maxRetries)
          throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new ServiceUnavailableException(
      `Cloudflare extraction failed (${lastStatus || 'timeout'}).`,
    );
  }

  private validate(
    body: Record<string, unknown>,
    expectedType: string,
  ): StructuredExtraction {
    const result = body.result as Record<string, unknown> | undefined;
    const candidate = result?.response ?? result ?? body;
    let value: unknown = candidate;
    if (typeof candidate === 'string') {
      const cleaned = candidate
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');
      try {
        value = JSON.parse(cleaned);
      } catch {
        throw new ServiceUnavailableException(
          'Cloudflare returned an invalid structured extraction result.',
        );
      }
    }
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new ServiceUnavailableException(
        'Cloudflare returned an invalid extraction object.',
      );
    const object = value as Record<string, unknown>;
    if (!Array.isArray(object.fields))
      throw new ServiceUnavailableException(
        'Cloudflare extraction fields are missing.',
      );
    const fields = object.fields.map((field, index) =>
      this.field(field, index),
    );
    return {
      documentType: this.text(object.documentType) ?? expectedType,
      detectedDocumentType:
        this.text(object.detectedDocumentType) ?? expectedType,
      documentTypeConfidence: this.confidence(object.documentTypeConfidence),
      language: this.text(object.language),
      rawText: this.text(object.rawText)?.slice(0, 100_000) ?? null,
      fields,
      missingFields: this.strings(object.missingFields),
      warnings: this.strings(object.warnings),
      providerRequestId: null,
    };
  }

  private field(value: unknown, index: number): ExtractedField {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new ServiceUnavailableException(
        `Invalid extraction field at index ${index}.`,
      );
    const field = value as Record<string, unknown>;
    const fieldCode = this.text(field.fieldCode);
    if (!fieldCode || !/^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(fieldCode))
      throw new ServiceUnavailableException(
        `Invalid extraction field code at index ${index}.`,
      );
    const rawValue = this.text(field.rawValue);
    return {
      fieldCode,
      rawValue,
      normalizedValue:
        this.text(field.normalizedValue) ?? this.normalize(rawValue),
      confidence: this.confidence(field.confidence),
      pageNumber: Number.isInteger(field.pageNumber)
        ? Number(field.pageNumber)
        : null,
      boundingBox: field.boundingBox ?? null,
      warnings: this.strings(field.warnings),
    };
  }

  private normalize(value: string | null) {
    if (!value) return null;
    const digits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
    return value
      .normalize('NFKC')
      .replace(/[٠-٩۰-۹]/g, (digit) => String(digits.indexOf(digit) % 10))
      .replace(/\s+/g, ' ')
      .trim();
  }
  private text(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  private strings(value: unknown) {
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.slice(0, 200))
      : [];
  }
  private confidence(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
  }
  private envNumber(name: string, fallback: number) {
    const value = Number(process.env[name] ?? fallback);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
}
