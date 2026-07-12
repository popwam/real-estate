import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DocumentExtractionProvider,
  OrganizationDocumentExtractionStatus,
} from '@prisma/client';
import type { Readable } from 'stream';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';

@Injectable()
export class DocumentExtractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly storage: FileStorageService,
  ) {}

  async extractOrganizationDocument(
    documentId: string,
    actor: AuthenticatedRequestUser,
  ) {
    const document = await this.prisma.organizationDocument.findUnique({
      where: { id: documentId },
      include: { file: true },
    });

    if (!document) {
      return null;
    }

    const providerConfig = this.providerConfig();
    if (!providerConfig.configured) {
      const updated = await this.prisma.organizationDocument.update({
        where: { id: document.id },
        data: {
          extractionProvider: DocumentExtractionProvider.NONE,
          extractionStatus:
            OrganizationDocumentExtractionStatus.NEEDS_MANUAL_REVIEW,
          extractionMessage:
            'OCR provider not configured. Upload is saved; fill extracted fields manually.',
        },
      });
      await this.auditLogs.record({
        action: 'organization_document.extraction_not_configured',
        entityType: 'OrganizationDocument',
        entityId: document.id,
        organizationId: document.organizationId,
        actor,
      });
      return updated;
    }

    if (!document.file) {
      throw new BadRequestException('Document file is required before extraction.');
    }
    this.assertFileSizeAllowed(document.file.sizeBytes);
    await this.assertExtractionLimit(document.organizationId);

    await this.prisma.organizationDocument.update({
      where: { id: document.id },
      data: {
        extractionProvider: providerConfig.provider,
        extractionStatus: OrganizationDocumentExtractionStatus.PENDING,
        extractionMessage:
          'Extraction started with configured provider. Legal data still requires manual review before applying.',
      },
    });
    await this.auditLogs.record({
      action: 'organization_document.extraction_requested',
      entityType: 'OrganizationDocument',
      entityId: document.id,
      organizationId: document.organizationId,
      actor,
      metadata: { provider: providerConfig.provider },
    });

    try {
      const object = await this.storage.readObject({
        bucket: document.file.bucket,
        objectKey: document.file.objectKey,
        purpose: 'COMPANY_DOCUMENT',
      });
      const buffer = await this.streamToBuffer(object.body);
      const extracted = await this.extractWithCloudflare({
        config: providerConfig,
        buffer,
        mimeType: document.file.mimeType ?? 'application/octet-stream',
        documentType: document.documentType,
      });
      const completed = await this.prisma.organizationDocument.update({
        where: { id: document.id },
        data: {
          extractionProvider: providerConfig.provider,
          extractionStatus:
            OrganizationDocumentExtractionStatus.NEEDS_MANUAL_REVIEW,
          extractionMessage:
            'Extraction completed. Review and apply selected fields manually.',
          extractedData: extracted,
        },
      });
      await this.auditLogs.record({
        action: 'organization_document.extraction_completed_manual_review',
        entityType: 'OrganizationDocument',
        entityId: document.id,
        organizationId: document.organizationId,
        actor,
        metadata: { provider: 'CLOUDFLARE_WORKERS_AI' },
      });
      return completed;
    } catch {
      const failed = await this.prisma.organizationDocument.update({
        where: { id: document.id },
        data: {
          extractionProvider: providerConfig.provider,
          extractionStatus:
            OrganizationDocumentExtractionStatus.NEEDS_MANUAL_REVIEW,
          extractionMessage:
            'Extraction failed or timed out. Review the document manually.',
        },
      });
      await this.auditLogs.record({
        action: 'organization_document.extraction_failed_manual_review',
        entityType: 'OrganizationDocument',
        entityId: document.id,
        organizationId: document.organizationId,
        actor,
        metadata: { provider: 'CLOUDFLARE_WORKERS_AI' },
      });
      return failed;
    }
  }

  private providerConfig() {
    if (process.env.DOCUMENT_EXTRACTION_PROVIDER !== 'CLOUDFLARE_WORKERS_AI') {
      return { configured: false as const, provider: DocumentExtractionProvider.NONE };
    }
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
    const gatewayId = process.env.CLOUDFLARE_AI_GATEWAY_ID?.trim();
    if (!accountId || !apiToken || !gatewayId) {
      return { configured: false as const, provider: DocumentExtractionProvider.NONE };
    }
    return {
      configured: true as const,
      provider: DocumentExtractionProvider.AI_PROVIDER,
      accountId,
      apiToken,
      gatewayId,
      model:
        process.env.CLOUDFLARE_AI_MODEL?.trim() ||
        '@cf/meta/llama-3.1-8b-instruct',
    };
  }

  private assertFileSizeAllowed(sizeBytes: number | null) {
    const maxMb = Number(process.env.DOCUMENT_EXTRACTION_MAX_FILE_MB ?? 10);
    const maxBytes = maxMb * 1024 * 1024;
    if (sizeBytes && Number.isFinite(maxBytes) && sizeBytes > maxBytes) {
      throw new BadRequestException(
        `Document exceeds DOCUMENT_EXTRACTION_MAX_FILE_MB (${maxMb} MB).`,
      );
    }
  }

  private async assertExtractionLimit(organizationId: string) {
    const dailyLimit = Number(process.env.DOCUMENT_EXTRACTION_DAILY_LIMIT_PER_ORG ?? 25);
    const monthlyLimit = Number(process.env.DOCUMENT_EXTRACTION_MONTHLY_LIMIT_PER_ORG ?? 250);
    const now = Date.now();
    const dayStart = new Date(now - 24 * 60 * 60 * 1000);
    const monthStart = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const [daily, monthly] = await Promise.all([
      this.prisma.organizationDocument.count({
        where: {
          organizationId,
          extractionStatus: { not: OrganizationDocumentExtractionStatus.NOT_REQUESTED },
          updatedAt: { gte: dayStart },
        },
      }),
      this.prisma.organizationDocument.count({
        where: {
          organizationId,
          extractionStatus: { not: OrganizationDocumentExtractionStatus.NOT_REQUESTED },
          updatedAt: { gte: monthStart },
        },
      }),
    ]);
    if (Number.isFinite(dailyLimit) && daily >= dailyLimit) {
      throw new BadRequestException('Daily document extraction limit reached.');
    }
    if (Number.isFinite(monthlyLimit) && monthly >= monthlyLimit) {
      throw new BadRequestException('Monthly document extraction limit reached.');
    }
  }

  private async extractWithCloudflare(input: {
    config: ReturnType<DocumentExtractionService['providerConfig']> & { configured: true };
    buffer: Buffer;
    mimeType: string;
    documentType: string;
  }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const endpoint = `https://gateway.ai.cloudflare.com/v1/${input.config.accountId}/${input.config.gatewayId}/workers-ai/${input.config.model}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'Extract public legal document fields as JSON. Do not approve, verify, or make decisions. Return unknown for uncertain values.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                documentType: input.documentType,
                mimeType: input.mimeType,
                fileBase64: input.buffer.toString('base64'),
                requestedFields: [
                  'legalName',
                  'commercialRegisterNumber',
                  'issuingOffice',
                  'issueDate',
                  'expiryDate',
                  'taxNumber',
                  'taxOffice',
                  'ownersOrShareholders',
                ],
              }),
            },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error('Cloudflare extraction request failed.');
      }
      const body = (await response.json()) as Record<string, unknown>;
      return {
        provider: 'CLOUDFLARE_WORKERS_AI',
        status: 'NEEDS_MANUAL_REVIEW',
        confidence: null,
        rawProviderResponse: this.redactedProviderResponse(body),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private redactedProviderResponse(body: Record<string, unknown>) {
    const result = body.result;
    if (result && typeof result === 'object') {
      return result;
    }
    return { received: true };
  }

  private async streamToBuffer(stream: Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
