import { BadRequestException, Injectable } from '@nestjs/common';
import { OnboardingDocumentQualityStatus } from '@prisma/client';

const SUPPORTED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class DocumentQualityService {
  inspect(buffer: Buffer, mimeType: string, maxMb: number) {
    if (!buffer.length)
      throw new BadRequestException('The uploaded file is empty.');
    if (!SUPPORTED.has(mimeType))
      throw new BadRequestException('Unsupported document MIME type.');
    if (buffer.length > maxMb * 1024 * 1024) {
      throw new BadRequestException(
        `Document exceeds the ${maxMb} MB policy limit.`,
      );
    }
    if (!this.magicMatches(buffer, mimeType)) {
      return {
        status: OnboardingDocumentQualityStatus.CORRUPTED,
        warnings: ['FILE_SIGNATURE_MISMATCH'],
      };
    }
    if (mimeType === 'application/pdf') {
      const sample = buffer
        .subarray(0, Math.min(buffer.length, 1_000_000))
        .toString('latin1');
      if (/\/Encrypt\b/.test(sample)) {
        return {
          status: OnboardingDocumentQualityStatus.PASSWORD_PROTECTED,
          warnings: ['PASSWORD_PROTECTED_PDF'],
        };
      }
      const pages = [...sample.matchAll(/\/Type\s*\/Page\b/g)].length;
      const maxPages = this.positiveEnv('DOCUMENT_EXTRACTION_MAX_PAGES', 10);
      if (pages > maxPages)
        throw new BadRequestException(
          `PDF exceeds the ${maxPages} page extraction limit.`,
        );
      return {
        status: OnboardingDocumentQualityStatus.ACCEPTED,
        warnings: pages
          ? [`PDF_PAGES_ESTIMATED_${pages}`]
          : ['PDF_PAGE_COUNT_UNCONFIRMED'],
      };
    }
    const dimensions =
      mimeType === 'image/png' ? this.pngDimensions(buffer) : null;
    if (dimensions && (dimensions.width < 800 || dimensions.height < 600)) {
      return {
        status: OnboardingDocumentQualityStatus.LOW_RESOLUTION,
        warnings: [`IMAGE_${dimensions.width}x${dimensions.height}`],
      };
    }
    return {
      status: OnboardingDocumentQualityStatus.ACCEPTED,
      warnings: dimensions
        ? [`IMAGE_${dimensions.width}x${dimensions.height}`]
        : ['IMAGE_DIMENSIONS_UNCONFIRMED'],
    };
  }

  private magicMatches(buffer: Buffer, mimeType: string) {
    if (mimeType === 'application/pdf')
      return buffer.subarray(0, 5).toString() === '%PDF-';
    if (mimeType === 'image/png')
      return buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (mimeType === 'image/jpeg')
      return (
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer.at(-2) === 0xff &&
        buffer.at(-1) === 0xd9
      );
    if (mimeType === 'image/webp')
      return (
        buffer.subarray(0, 4).toString() === 'RIFF' &&
        buffer.subarray(8, 12).toString() === 'WEBP'
      );
    return false;
  }

  private pngDimensions(buffer: Buffer) {
    return buffer.length >= 24
      ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
      : null;
  }

  private positiveEnv(name: string, fallback: number) {
    const value = Number(process.env[name] ?? fallback);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
