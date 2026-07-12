import { Injectable } from '@nestjs/common';
import {
  DocumentExtractionProvider,
  OrganizationDocumentExtractionStatus,
} from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DocumentExtractionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
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

    const provider = this.provider();
    if (provider === DocumentExtractionProvider.NONE) {
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

    const updated = await this.prisma.organizationDocument.update({
      where: { id: document.id },
      data: {
        extractionProvider: provider,
        extractionStatus: OrganizationDocumentExtractionStatus.PENDING,
        extractionMessage:
          'Extraction queued for configured provider. Legal data still requires manual review before applying.',
      },
    });

    await this.auditLogs.record({
      action: 'organization_document.extraction_requested',
      entityType: 'OrganizationDocument',
      entityId: document.id,
      organizationId: document.organizationId,
      actor,
      metadata: { provider },
    });

    return updated;
  }

  private provider() {
    if (process.env.COMPANY_DOCUMENT_AI_PROVIDER_KEY) {
      return DocumentExtractionProvider.AI_PROVIDER;
    }
    if (process.env.COMPANY_DOCUMENT_OCR_PROVIDER_KEY) {
      return DocumentExtractionProvider.OCR_PROVIDER;
    }
    return DocumentExtractionProvider.NONE;
  }
}
