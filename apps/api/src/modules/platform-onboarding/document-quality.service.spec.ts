import { BadRequestException } from '@nestjs/common';
import { OnboardingDocumentQualityStatus } from '@prisma/client';
import { DocumentQualityService } from './document-quality.service';

describe('DocumentQualityService', () => {
  const service = new DocumentQualityService();

  it('rejects empty and unsupported files', () => {
    expect(() => service.inspect(Buffer.alloc(0), 'image/png', 10)).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.inspect(Buffer.from('hello'), 'text/plain', 10),
    ).toThrow(BadRequestException);
  });

  it('rejects a MIME/signature mismatch as corrupted', () => {
    expect(
      service.inspect(Buffer.from('not a pdf'), 'application/pdf', 10),
    ).toEqual({
      status: OnboardingDocumentQualityStatus.CORRUPTED,
      warnings: ['FILE_SIGNATURE_MISMATCH'],
    });
  });

  it('detects password-protected PDFs without logging their contents', () => {
    const result = service.inspect(
      Buffer.from('%PDF-1.7\n1 0 obj<</Encrypt 2 0 R>>'),
      'application/pdf',
      10,
    );
    expect(result.status).toBe(
      OnboardingDocumentQualityStatus.PASSWORD_PROTECTED,
    );
  });

  it('marks a small valid PNG as low resolution', () => {
    const buffer = Buffer.alloc(32);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
    buffer.writeUInt32BE(320, 16);
    buffer.writeUInt32BE(240, 20);
    expect(service.inspect(buffer, 'image/png', 10).status).toBe(
      OnboardingDocumentQualityStatus.LOW_RESOLUTION,
    );
  });
});
