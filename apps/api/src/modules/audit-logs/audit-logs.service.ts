import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    action: string;
    entityType: string;
    entityId?: string;
    actor?: AuthenticatedRequestUser;
    organizationId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        actorUserId: params.actor?.userId,
        organizationId:
          params.organizationId === undefined
            ? params.actor?.organizationId
            : params.organizationId,
        metadata: params.metadata as any,
      },
    });
  }
}
