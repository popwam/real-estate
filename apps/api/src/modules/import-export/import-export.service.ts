import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ImportJobStatus,
  ImportJobType,
  ImportRowStatus,
  ImportSourceFormat,
  Prisma,
  AccountingTransactionStatus,
  AccountingTransactionType,
  AdsCampaignProvider,
  AdsCampaignStatus,
  CameraDeviceProvider,
  CameraDeviceStatus,
  HrAttendanceStatus,
  HrEmployeeStatus,
  LegalCaseStatus,
  LegalDocumentStatus,
  LegalDocumentType,
  ProjectStatus,
  ProjectType,
  ProjectVisibility,
  UnitFinishing,
  UnitStatus,
  UnitType,
  UnitVisibility,
} from '@prisma/client';
import {
  isPlatformUser,
  requireCurrentOrganizationId,
} from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { PreviewProjectInventoryImportDto } from './dto/preview-project-inventory-import.dto';

type ImportRowInput = Record<string, unknown>;

type RowIssue = {
  field: string;
  message: string;
};

type NormalizedImportRow = {
  projectName: string;
  projectSlug: string;
  projectType: ProjectType;
  city: string;
  district: string;
  address?: string;
  description?: string;
  projectStatus: ProjectStatus;
  projectVisibility: ProjectVisibility;
  deliveryDate?: string;
  phaseName?: string;
  phaseStatus?: ProjectStatus;
  phaseDeliveryDate?: string;
  unitCode: string;
  unitType: UnitType;
  areaSqm: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  view?: string;
  finishing?: UnitFinishing;
  basePrice: number;
  currency: string;
  unitStatus: UnitStatus;
  visibility: UnitVisibility;
  planName?: string;
  downPaymentPercent?: number;
  years?: number;
  installmentFrequency?: string;
};

type OperationsImportType = Exclude<ImportJobType, 'PROJECT_INVENTORY'>;
const OPERATIONS_IMPORT_PERMISSIONS: Record<OperationsImportType, string> = {
  HR_EMPLOYEES: 'imports.hr',
  HR_ATTENDANCE: 'imports.hr',
  ACCOUNTING_TRANSACTIONS: 'imports.accounting',
  LEGAL_DOCUMENTS: 'imports.legal',
  LEGAL_CASES: 'imports.legal',
  ADS_CAMPAIGNS: 'imports.ads',
  CAMERA_DEVICES: 'imports.cameras',
};

@Injectable()
export class ImportExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async previewProjectInventory(
    dto: PreviewProjectInventoryImportDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = await this.requireDeveloperImportScope(currentUser);
    const sourceFormat = this.parseSourceFormat(dto.sourceFormat);
    const rows = this.extractRows(dto, sourceFormat);

    const parsedRows = rows.map((row, index) => {
      const rowNumber = index + 1;
      const normalized = this.normalizeRow(row, rowNumber);

      return {
        rowNumber,
        rawData: row,
        normalizedData: normalized.normalized,
        status: normalized.errors.length ? 'INVALID' : 'VALID',
        errors: normalized.errors,
        warnings: normalized.warnings,
      };
    });

    const validRows = parsedRows.filter((row) => row.status === 'VALID').length;
    const invalidRows = parsedRows.length - validRows;
    const summary = {
      type: 'PROJECT_INVENTORY',
      sourceFormat,
      originalFileName: this.optionalString(dto.originalFileName),
      totalRows: parsedRows.length,
      validRows,
      invalidRows,
    };

    const job = await this.prisma.importJob.create({
      data: {
        organizationId,
        createdByUserId: currentUser.userId,
        type: 'PROJECT_INVENTORY',
        status: invalidRows === parsedRows.length ? 'FAILED' : 'READY',
        originalFileName: this.optionalString(dto.originalFileName),
        sourceFormat,
        totalRows: parsedRows.length,
        validRows,
        invalidRows,
        summary,
        rows: {
          create: parsedRows.map((row) => ({
            rowNumber: row.rowNumber,
            rawData: row.rawData as Prisma.InputJsonValue,
            normalizedData: row.normalizedData as Prisma.InputJsonValue,
            status: row.status as ImportRowStatus,
            errors: row.errors as Prisma.InputJsonValue,
            warnings: row.warnings as Prisma.InputJsonValue,
          })),
        },
      },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    });

    await this.auditLogs.record({
      action: 'import_job.previewed',
      entityType: 'ImportJob',
      entityId: job.id,
      organizationId,
      actor: currentUser,
      metadata: summary,
    });

    return {
      jobId: job.id,
      totalRows: job.totalRows,
      validRows: job.validRows,
      invalidRows: job.invalidRows,
      rowErrors: job.rows
        .filter((row) => row.status === 'INVALID')
        .map((row) => ({ rowNumber: row.rowNumber, errors: row.errors ?? [] })),
      warnings: job.rows
        .filter((row) => Array.isArray(row.warnings) && row.warnings.length)
        .map((row) => ({ rowNumber: row.rowNumber, warnings: row.warnings })),
    };
  }

  async previewOperationsImport(
    typeParam: string,
    dto: PreviewProjectInventoryImportDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const type = this.parseOperationsImportType(typeParam);
    const organizationId = await this.requireOperationsImportScope(currentUser, type);
    const sourceFormat = this.parseSourceFormat(dto.sourceFormat);
    const rows = this.extractRows(dto, sourceFormat);

    const parsedRows = rows.map((row, index) => {
      const rowNumber = index + 1;
      const normalized = this.normalizeOperationsRow(type, row, rowNumber);

      return {
        rowNumber,
        rawData: this.sanitizeOperationsRawRow(type, row),
        normalizedData: normalized.normalized,
        status: normalized.errors.length ? 'INVALID' : 'VALID',
        errors: normalized.errors,
        warnings: normalized.warnings,
      };
    });

    const validRows = parsedRows.filter((row) => row.status === 'VALID').length;
    const invalidRows = parsedRows.length - validRows;
    const summary = {
      type,
      sourceFormat,
      originalFileName: this.optionalString(dto.originalFileName),
      totalRows: parsedRows.length,
      validRows,
      invalidRows,
    };

    const job = await this.prisma.importJob.create({
      data: {
        organizationId,
        createdByUserId: currentUser.userId,
        type,
        status: invalidRows === parsedRows.length ? 'FAILED' : 'READY',
        originalFileName: this.optionalString(dto.originalFileName),
        sourceFormat,
        totalRows: parsedRows.length,
        validRows,
        invalidRows,
        summary,
        rows: {
          create: parsedRows.map((row) => ({
            rowNumber: row.rowNumber,
            rawData: row.rawData as Prisma.InputJsonValue,
            normalizedData: row.normalizedData as Prisma.InputJsonValue,
            status: row.status as ImportRowStatus,
            errors: row.errors as Prisma.InputJsonValue,
            warnings: row.warnings as Prisma.InputJsonValue,
          })),
        },
      },
      include: { rows: { orderBy: { rowNumber: 'asc' } } },
    });

    await this.auditLogs.record({
      action: 'operations_import_job.previewed',
      entityType: 'ImportJob',
      entityId: job.id,
      organizationId,
      actor: currentUser,
      metadata: summary,
    });

    return {
      jobId: job.id,
      type,
      totalRows: job.totalRows,
      validRows: job.validRows,
      invalidRows: job.invalidRows,
      rowErrors: job.rows
        .filter((row) => row.status === 'INVALID')
        .map((row) => ({ rowNumber: row.rowNumber, errors: row.errors ?? [] })),
      warnings: job.rows
        .filter((row) => Array.isArray(row.warnings) && row.warnings.length)
        .map((row) => ({ rowNumber: row.rowNumber, warnings: row.warnings })),
    };
  }

  async listJobs(currentUser: AuthenticatedRequestUser) {
    const where = this.importJobScopeWhere(currentUser);

    return this.prisma.importJob.findMany({
      where,
      include: { createdBy: { select: this.safeUserSelect() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJob(id: string, currentUser: AuthenticatedRequestUser) {
    const job = await this.prisma.importJob.findFirst({
      where: { id, ...this.importJobScopeWhere(currentUser) },
      include: {
        createdBy: { select: this.safeUserSelect() },
        organization: { select: this.safeOrganizationSelect() },
        rows: { orderBy: { rowNumber: 'asc' } },
      },
    });

    if (!job) {
      throw new NotFoundException('Import job not found.');
    }

    return job;
  }

  async commitJob(id: string, currentUser: AuthenticatedRequestUser) {
    const job = await this.getJob(id, currentUser);
    await this.assertCanCommitJob(job.organizationId, currentUser, job.type);

    if (job.type !== 'PROJECT_INVENTORY') {
      return this.commitOperationsJob(job as any, currentUser);
    }

    if (job.status === 'COMMITTED') {
      return {
        jobId: job.id,
        status: job.status,
        alreadyCommitted: true,
        summary: job.summary,
      };
    }

    if (job.status === 'CANCELLED') {
      throw new ConflictException('Cancelled import jobs cannot be committed.');
    }

    const validRows = job.rows.filter((row) => row.status === 'VALID');

    if (!validRows.length) {
      throw new BadRequestException('Import job has no valid rows to commit.');
    }

    const counts = {
      projectsCreated: 0,
      projectsUpdated: 0,
      phasesCreated: 0,
      phasesUpdated: 0,
      unitsCreated: 0,
      unitsUpdated: 0,
      paymentPlansCreated: 0,
      paymentPlansUpdated: 0,
      rowsCommitted: 0,
      rowsSkipped: job.invalidRows,
    };

    await this.prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const data = row.normalizedData as NormalizedImportRow;
        const existingProject = await tx.project.findFirst({
          where: { developerId: job.organizationId, slug: data.projectSlug },
          select: { id: true },
        });

        const project = await tx.project.upsert({
          where: {
            developerId_slug: {
              developerId: job.organizationId,
              slug: data.projectSlug,
            },
          },
          create: {
            developerId: job.organizationId,
            name: data.projectName,
            slug: data.projectSlug,
            type: data.projectType,
            status: data.projectStatus,
            city: data.city,
            district: data.district,
            address: data.address,
            deliveryDate: this.toDate(data.deliveryDate),
            description: data.description,
            images: [],
            videos: [],
            amenities: [],
            visibility: data.projectVisibility,
          },
          update: {
            name: data.projectName,
            type: data.projectType,
            status: data.projectStatus,
            city: data.city,
            district: data.district,
            address: data.address,
            deliveryDate: this.toDate(data.deliveryDate),
            description: data.description,
            visibility: data.projectVisibility,
          },
        });

        if (existingProject) {
          counts.projectsUpdated += 1;
        } else {
          counts.projectsCreated += 1;
        }

        let phaseId: string | undefined;
        if (data.phaseName) {
          const existingPhase = await tx.projectPhase.findFirst({
            where: { projectId: project.id, name: data.phaseName },
          });

          const phasePayload = {
            deliveryDate: this.toDate(data.phaseDeliveryDate),
            status: data.phaseStatus ?? data.projectStatus,
          };

          if (existingPhase) {
            const phase = await tx.projectPhase.update({
              where: { id: existingPhase.id },
              data: phasePayload,
            });
            phaseId = phase.id;
            counts.phasesUpdated += 1;
          } else {
            const phase = await tx.projectPhase.create({
              data: {
                projectId: project.id,
                name: data.phaseName,
                ...phasePayload,
              },
            });
            phaseId = phase.id;
            counts.phasesCreated += 1;
          }
        }

        const existingUnit = await tx.inventoryUnit.findFirst({
          where: { projectId: project.id, unitNumber: data.unitCode },
          select: { id: true },
        });
        const pricePerSqm =
          data.areaSqm > 0
            ? new Prisma.Decimal(data.basePrice).div(data.areaSqm)
            : undefined;

        const unit = await tx.inventoryUnit.upsert({
          where: {
            projectId_unitNumber: {
              projectId: project.id,
              unitNumber: data.unitCode,
            },
          },
          create: {
            projectId: project.id,
            phaseId,
            developerId: job.organizationId,
            unitNumber: data.unitCode,
            unitType: data.unitType,
            areaSqm: new Prisma.Decimal(data.areaSqm),
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            floor: data.floor,
            view: data.view,
            finishing: data.finishing,
            basePrice: new Prisma.Decimal(data.basePrice),
            currency: data.currency,
            pricePerSqm,
            status: data.unitStatus,
            visibility: data.visibility,
            images: [],
          },
          update: {
            phaseId,
            unitType: data.unitType,
            areaSqm: new Prisma.Decimal(data.areaSqm),
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            floor: data.floor,
            view: data.view,
            finishing: data.finishing,
            basePrice: new Prisma.Decimal(data.basePrice),
            currency: data.currency,
            pricePerSqm,
            status: data.unitStatus,
            visibility: data.visibility,
          },
        });

        if (existingUnit) {
          counts.unitsUpdated += 1;
        } else {
          counts.unitsCreated += 1;
        }

        if (data.planName) {
          const existingPlan = await tx.paymentPlan.findFirst({
            where: { projectId: project.id, unitId: null, name: data.planName },
            select: { id: true },
          });
          const installmentMonths = data.years
            ? Math.round(data.years * 12)
            : undefined;
          const planPayload = {
            downPaymentPct:
              data.downPaymentPercent === undefined
                ? undefined
                : new Prisma.Decimal(data.downPaymentPercent),
            installmentMonths,
            conditions: {
              importRowNumber: row.rowNumber,
              installmentFrequency: data.installmentFrequency,
            } as Prisma.InputJsonValue,
          };

          if (existingPlan) {
            await tx.paymentPlan.update({
              where: { id: existingPlan.id },
              data: planPayload,
            });
            counts.paymentPlansUpdated += 1;
          } else {
            await tx.paymentPlan.create({
              data: {
                projectId: project.id,
                scope: 'PROJECT',
                name: data.planName,
                isActive: true,
                ...planPayload,
              },
            });
            counts.paymentPlansCreated += 1;
          }
        }

        await tx.importJobRow.update({
          where: { id: row.id },
          data: { status: 'COMMITTED' },
        });
        counts.rowsCommitted += 1;
      }

      await tx.importJob.update({
        where: { id: job.id },
        data: {
          status: 'COMMITTED',
          committedAt: new Date(),
          summary: { ...(job.summary as object), commit: counts },
        },
      });
    });

    await this.auditLogs.record({
      action: 'import_job.committed',
      entityType: 'ImportJob',
      entityId: job.id,
      organizationId: job.organizationId,
      actor: currentUser,
      metadata: counts,
    });

    return { jobId: job.id, status: 'COMMITTED', ...counts };
  }

  private async commitOperationsJob(job: Awaited<ReturnType<ImportExportService['getJob']>>, currentUser: AuthenticatedRequestUser) {
    if (job.status === 'COMMITTED') {
      return {
        jobId: job.id,
        status: job.status,
        alreadyCommitted: true,
        summary: job.summary,
      };
    }

    if (job.status === 'CANCELLED') {
      throw new ConflictException('Cancelled import jobs cannot be committed.');
    }

    const validRows = job.rows.filter((row) => row.status === 'VALID');
    if (!validRows.length) {
      throw new BadRequestException('Import job has no valid rows to commit.');
    }

    const counts = {
      rowsCommitted: 0,
      rowsSkipped: job.invalidRows,
      created: 0,
      updated: 0,
    };

    await this.prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const data = row.normalizedData as any;
        const result = await this.commitOperationsRow(tx, job.type as OperationsImportType, job.organizationId, data, currentUser.userId);
        counts.created += result.created ? 1 : 0;
        counts.updated += result.updated ? 1 : 0;
        counts.rowsCommitted += 1;
        await tx.importJobRow.update({ where: { id: row.id }, data: { status: 'COMMITTED' } });
      }

      await tx.importJob.update({
        where: { id: job.id },
        data: {
          status: 'COMMITTED',
          committedAt: new Date(),
          summary: { ...(job.summary as object), commit: counts },
        },
      });
    });

    await this.auditLogs.record({
      action: 'operations_import_job.committed',
      entityType: 'ImportJob',
      entityId: job.id,
      organizationId: job.organizationId,
      actor: currentUser,
      metadata: { type: job.type, ...counts },
    });

    return { jobId: job.id, type: job.type, status: 'COMMITTED', ...counts };
  }

  async cancelJob(id: string, currentUser: AuthenticatedRequestUser) {
    const job = await this.getJob(id, currentUser);
    await this.assertCanCommitJob(job.organizationId, currentUser, job.type);

    if (job.status === 'COMMITTED') {
      throw new ConflictException('Committed import jobs cannot be cancelled.');
    }

    const cancellable: ImportJobStatus[] = ['DRAFT', 'READY', 'FAILED'];
    if (!cancellable.includes(job.status)) {
      throw new ConflictException('Import job cannot be cancelled in its current status.');
    }

    const updated = await this.prisma.importJob.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.auditLogs.record({
      action: 'import_job.cancelled',
      entityType: 'ImportJob',
      entityId: job.id,
      organizationId: job.organizationId,
      actor: currentUser,
    });

    return updated;
  }

  async exportProjects(currentUser: AuthenticatedRequestUser) {
    this.assertExportOrganizationPermission(currentUser);

    return {
      dataType: 'projects',
      scope: this.exportScope(currentUser),
      data: await this.prisma.project.findMany({
        where: this.developerScopedWhere(currentUser, 'developerId'),
        include: {
          phases: true,
          paymentPlans: true,
          _count: { select: { inventoryUnits: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async exportInventory(currentUser: AuthenticatedRequestUser) {
    this.assertExportOrganizationPermission(currentUser);

    return {
      dataType: 'inventory',
      scope: this.exportScope(currentUser),
      data: await this.prisma.inventoryUnit.findMany({
        where: this.developerScopedWhere(currentUser, 'developerId'),
        include: {
          project: { select: { id: true, name: true, slug: true, developerId: true } },
          phase: true,
          paymentPlans: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async exportDeals(currentUser: AuthenticatedRequestUser) {
    this.assertExportOrganizationPermission(currentUser);

    return {
      dataType: 'deals',
      scope: this.exportScope(currentUser),
      data: await this.prisma.deal.findMany({
        where: this.dealScopedWhere(currentUser),
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async exportCommissions(currentUser: AuthenticatedRequestUser) {
    this.assertExportOrganizationPermission(currentUser);

    return {
      dataType: 'commissions',
      scope: this.exportScope(currentUser),
      data: await this.prisma.commissionEntry.findMany({
        where: this.commissionScopedWhere(currentUser),
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async exportAccount(currentUser: AuthenticatedRequestUser) {
    this.assertExportOrganizationPermission(currentUser);

    const organizationWhere = isPlatformUser(currentUser)
      ? {}
      : { id: requireCurrentOrganizationId(currentUser) };

    return {
      dataType: 'account',
      scope: this.exportScope(currentUser),
      data: await this.prisma.organization.findMany({
        where: organizationWhere,
        select: {
          ...this.safeOrganizationSelect(),
          profile: true,
          users: {
            select: this.safeUserSelect(),
            orderBy: { createdAt: 'asc' },
          },
          websiteSettings: true,
          domainVerifications: {
            select: {
              id: true,
              organizationId: true,
              domain: true,
              type: true,
              status: true,
              lastCheckedAt: true,
              verifiedAt: true,
              failureReason: true,
              statusNote: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  private normalizeOperationsRow(type: OperationsImportType, raw: ImportRowInput, rowNumber: number) {
    const row = this.normalizeKeys(raw);
    const errors: RowIssue[] = [];
    const warnings: RowIssue[] = [];
    const normalized: Record<string, unknown> = {};
    const id = this.optionalString(row.id);
    if (id) normalized.id = id;

    switch (type) {
      case 'HR_EMPLOYEES':
        normalized.name = this.requiredString(row, 'name', errors);
        normalized.email = this.optionalString(row.email);
        normalized.phone = this.optionalString(row.phone);
        normalized.roleTitle = this.optionalString(row.roleTitle);
        normalized.departmentId = this.optionalString(row.departmentId);
        normalized.status = this.enumValue(row.status, HrEmployeeStatus, 'status', errors, true) ?? 'ACTIVE';
        break;
      case 'HR_ATTENDANCE':
        normalized.employeeId = this.requiredString(row, 'employeeId', errors);
        normalized.date = this.optionalDateString(row.date, 'date', errors) ?? new Date().toISOString();
        normalized.checkInAt = this.optionalDateString(row.checkInAt, 'checkInAt', errors);
        normalized.checkOutAt = this.optionalDateString(row.checkOutAt, 'checkOutAt', errors);
        normalized.status = this.enumValue(row.status, HrAttendanceStatus, 'status', errors) ?? 'PRESENT';
        normalized.note = this.optionalString(row.note);
        break;
      case 'ACCOUNTING_TRANSACTIONS':
        normalized.type = this.enumValue(row.type, AccountingTransactionType, 'type', errors);
        normalized.amount = this.requiredNonNegativeNumber(row.amount, 'amount', errors);
        normalized.currency = this.optionalString(row.currency) ?? 'EGP';
        normalized.categoryId = this.optionalString(row.categoryId);
        normalized.description = this.optionalString(row.description);
        normalized.occurredAt = this.optionalDateString(row.occurredAt, 'occurredAt', errors) ?? new Date().toISOString();
        normalized.status = this.enumValue(row.status, AccountingTransactionStatus, 'status', errors, true) ?? 'DRAFT';
        break;
      case 'LEGAL_DOCUMENTS':
        normalized.title = this.requiredString(row, 'title', errors);
        normalized.type = this.enumValue(row.type, LegalDocumentType, 'type', errors, true) ?? 'OTHER';
        normalized.status = this.enumValue(row.status, LegalDocumentStatus, 'status', errors, true) ?? 'DRAFT';
        normalized.relatedProjectId = this.optionalString(row.relatedProjectId);
        break;
      case 'LEGAL_CASES':
        normalized.title = this.requiredString(row, 'title', errors);
        normalized.status = this.enumValue(row.status, LegalCaseStatus, 'status', errors, true) ?? 'OPEN';
        normalized.description = this.optionalString(row.description);
        break;
      case 'ADS_CAMPAIGNS':
        normalized.name = this.requiredString(row, 'name', errors);
        normalized.provider = this.enumValue(row.provider, AdsCampaignProvider, 'provider', errors, true) ?? 'OTHER';
        normalized.status = this.enumValue(row.status, AdsCampaignStatus, 'status', errors, true) ?? 'DRAFT';
        normalized.budgetAmount = this.optionalNonNegativeNumber(row.budgetAmount, 'budgetAmount', errors);
        normalized.currency = this.optionalString(row.currency);
        normalized.externalAccountId = this.optionalString(row.externalAccountId);
        normalized.externalCampaignId = this.optionalString(row.externalCampaignId);
        break;
      case 'CAMERA_DEVICES':
        normalized.name = this.requiredString(row, 'name', errors);
        normalized.location = this.optionalString(row.location);
        normalized.provider = this.enumValue(row.provider, CameraDeviceProvider, 'provider', errors, true) ?? 'OTHER';
        normalized.status = this.enumValue(row.status, CameraDeviceStatus, 'status', errors, true) ?? 'ACTIVE';
        normalized.aiEnabled = this.optionalBoolean(row.aiEnabled);
        normalized.projectId = this.optionalString(row.projectId);
        if (this.optionalString((row as any).streamUrl) || this.optionalString((row as any).streamUrlMasked) || this.optionalString((row as any).credentials)) {
          warnings.push({ field: 'streamUrl', message: 'Stream URLs are ignored for camera imports.' });
        }
        break;
      default:
        errors.push({ field: 'type', message: `Unsupported operations import type at row ${rowNumber}.` });
    }

    return { normalized: errors.length ? undefined : normalized, errors, warnings };
  }

  private async commitOperationsRow(
    tx: Prisma.TransactionClient,
    type: OperationsImportType,
    organizationId: string,
    data: any,
    userId: string,
  ) {
    await this.assertOperationsImportReferences(tx, type, organizationId, data);

    switch (type) {
      case 'HR_EMPLOYEES': {
        if (data.id) {
          const existing = await tx.hrEmployee.findFirst({ where: { id: data.id, organizationId }, select: { id: true } });
          if (existing) {
            await tx.hrEmployee.update({ where: { id: data.id }, data: { name: data.name, email: data.email, phone: data.phone, roleTitle: data.roleTitle, departmentId: data.departmentId, status: data.status } });
            return { updated: true };
          }
        }
        await tx.hrEmployee.create({ data: { organizationId, name: data.name, email: data.email, phone: data.phone, roleTitle: data.roleTitle, departmentId: data.departmentId, status: data.status } });
        return { created: true };
      }
      case 'HR_ATTENDANCE':
        await tx.hrAttendanceRecord.create({ data: { organizationId, employeeId: data.employeeId, date: new Date(data.date), checkInAt: this.toDate(data.checkInAt), checkOutAt: this.toDate(data.checkOutAt), status: data.status, note: data.note } });
        return { created: true };
      case 'ACCOUNTING_TRANSACTIONS': {
        if (data.id) {
          const existing = await tx.accountingTransaction.findFirst({ where: { id: data.id, organizationId }, select: { id: true } });
          if (existing) {
            await tx.accountingTransaction.update({ where: { id: data.id }, data: { type: data.type, amount: new Prisma.Decimal(data.amount), currency: data.currency, categoryId: data.categoryId, description: data.description, occurredAt: new Date(data.occurredAt), status: data.status } });
            return { updated: true };
          }
        }
        await tx.accountingTransaction.create({ data: { organizationId, type: data.type, amount: new Prisma.Decimal(data.amount), currency: data.currency, categoryId: data.categoryId, description: data.description, occurredAt: new Date(data.occurredAt), status: data.status, createdByUserId: userId } });
        return { created: true };
      }
      case 'LEGAL_DOCUMENTS': {
        if (data.id) {
          const existing = await tx.legalDocument.findFirst({ where: { id: data.id, organizationId }, select: { id: true } });
          if (existing) {
            await tx.legalDocument.update({ where: { id: data.id }, data: { title: data.title, type: data.type, status: data.status, relatedProjectId: data.relatedProjectId } });
            return { updated: true };
          }
        }
        await tx.legalDocument.create({ data: { organizationId, title: data.title, type: data.type, status: data.status, relatedProjectId: data.relatedProjectId } });
        return { created: true };
      }
      case 'LEGAL_CASES':
        await tx.legalCase.create({ data: { organizationId, title: data.title, status: data.status, description: data.description } });
        return { created: true };
      case 'ADS_CAMPAIGNS':
        await tx.adsCampaign.create({ data: { organizationId, name: data.name, provider: data.provider, status: data.status, budgetAmount: data.budgetAmount === undefined ? undefined : new Prisma.Decimal(data.budgetAmount), currency: data.currency, externalAccountId: data.externalAccountId, externalCampaignId: data.externalCampaignId } });
        return { created: true };
      case 'CAMERA_DEVICES':
        await tx.cameraDevice.create({ data: { organizationId, name: data.name, location: data.location, provider: data.provider, status: data.status, aiEnabled: Boolean(data.aiEnabled), projectId: data.projectId } });
        return { created: true };
    }
  }

  private async assertOperationsImportReferences(
    tx: Prisma.TransactionClient,
    type: OperationsImportType,
    organizationId: string,
    data: any,
  ) {
    if (type === 'HR_EMPLOYEES' && data.departmentId) {
      const department = await tx.hrDepartment.findFirst({ where: { id: data.departmentId, organizationId }, select: { id: true } });
      if (!department) throw new BadRequestException('Imported departmentId is not available for this organization.');
    }

    if (type === 'HR_ATTENDANCE') {
      const employee = await tx.hrEmployee.findFirst({ where: { id: data.employeeId, organizationId }, select: { id: true } });
      if (!employee) throw new BadRequestException('Imported employeeId is not available for this organization.');
    }

    if (type === 'ACCOUNTING_TRANSACTIONS' && data.categoryId) {
      const category = await tx.accountingCategory.findFirst({ where: { id: data.categoryId, organizationId }, select: { id: true } });
      if (!category) throw new BadRequestException('Imported categoryId is not available for this organization.');
    }

    if (type === 'LEGAL_DOCUMENTS' && data.relatedProjectId) {
      const project = await tx.project.findFirst({ where: { id: data.relatedProjectId, developerId: organizationId }, select: { id: true } });
      if (!project) throw new BadRequestException('Imported relatedProjectId is not available for this organization.');
    }

    if (type === 'CAMERA_DEVICES' && data.projectId) {
      const project = await tx.project.findFirst({ where: { id: data.projectId, developerId: organizationId }, select: { id: true } });
      if (!project) throw new BadRequestException('Imported projectId is not available for this organization.');
    }
  }

  private sanitizeOperationsRawRow(type: OperationsImportType, row: ImportRowInput) {
    if (type !== 'CAMERA_DEVICES') return row;
    const sanitized = { ...row };
    for (const key of Object.keys(sanitized)) {
      const normalized = key.toLowerCase();
      if (normalized.includes('stream') || normalized.includes('credential') || normalized.includes('password') || normalized.includes('token')) {
        delete sanitized[key];
      }
    }
    return sanitized;
  }

  private parseOperationsImportType(typeParam: string): OperationsImportType {
    const normalized = typeParam.trim().replace(/-/g, '_').toUpperCase();
    if (!Object.values(ImportJobType).includes(normalized as ImportJobType) || normalized === 'PROJECT_INVENTORY') {
      throw new BadRequestException('Operations import type is invalid.');
    }
    return normalized as OperationsImportType;
  }

  private async requireOperationsImportScope(currentUser: AuthenticatedRequestUser, type: OperationsImportType) {
    this.assertOperationsImportPermission(currentUser, type);
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Platform import on behalf is not enabled for operations imports.');
    }
    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType !== 'DEVELOPER') {
      throw new ForbiddenException('Only developer organizations can import operations data.');
    }
    return organizationId;
  }

  private normalizeRow(raw: ImportRowInput, rowNumber: number) {
    const row = this.normalizeKeys(raw);
    const errors: RowIssue[] = [];
    const warnings: RowIssue[] = [];

    const projectName = this.requiredString(row, 'projectName', errors);
    const projectSlug = this.slugify(
      this.optionalString(row.projectSlug) ?? projectName ?? `project-${rowNumber}`,
    );
    const projectType = this.enumValue(
      row.projectType,
      ProjectType,
      'projectType',
      errors,
    );
    const city = this.requiredString(row, 'city', errors);
    const district = this.requiredString(row, 'district', errors);
    const projectStatus =
      this.enumValue(row.projectStatus, ProjectStatus, 'projectStatus', errors, true) ??
      'DRAFT';
    const projectVisibility =
      this.enumValue(
        row.projectVisibility,
        ProjectVisibility,
        'projectVisibility',
        errors,
        true,
      ) ?? 'PRIVATE';
    const deliveryDate = this.optionalDateString(row.deliveryDate, 'deliveryDate', errors);
    const phaseName = this.optionalString(row.phaseName);
    const phaseStatus = this.enumValue(
      row.phaseStatus,
      ProjectStatus,
      'phaseStatus',
      errors,
      true,
    );
    const phaseDeliveryDate = this.optionalDateString(
      row.phaseDeliveryDate,
      'phaseDeliveryDate',
      errors,
    );
    const unitType = this.enumValue(row.unitType, UnitType, 'unitType', errors);
    const areaSqm = this.requiredNonNegativeNumber(row.areaSqm, 'areaSqm', errors);
    const basePrice = this.requiredNonNegativeNumber(row.basePrice, 'basePrice', errors);
    const unitStatus =
      this.enumValue(row.unitStatus, UnitStatus, 'unitStatus', errors, true) ??
      'AVAILABLE';
    const visibility =
      this.enumValue(row.visibility, UnitVisibility, 'visibility', errors, true) ??
      'INHERIT_PROJECT';
    const finishing = this.enumValue(
      row.finishing,
      UnitFinishing,
      'finishing',
      errors,
      true,
    );
    const unitCode =
      this.optionalString(row.unitCode) ??
      `${projectSlug || `project-${rowNumber}`}-unit-${rowNumber}`;

    if (!this.optionalString(row.unitCode)) {
      warnings.push({
        field: 'unitCode',
        message: `unitCode missing; generated ${unitCode}.`,
      });
    }

    const bedrooms = this.optionalNonNegativeInteger(row.bedrooms, 'bedrooms', errors);
    const bathrooms = this.optionalNonNegativeInteger(row.bathrooms, 'bathrooms', errors);
    const downPaymentPercent = this.optionalPercent(
      row.downPaymentPercent,
      'downPaymentPercent',
      errors,
    );
    const years = this.optionalNonNegativeNumber(row.years, 'years', errors);

    const normalized: NormalizedImportRow | undefined = errors.length
      ? undefined
      : {
          projectName: projectName!,
          projectSlug,
          projectType: projectType!,
          city: city!,
          district: district!,
          address: this.optionalString(row.address),
          description: this.optionalString(row.description),
          projectStatus,
          projectVisibility,
          deliveryDate,
          phaseName,
          phaseStatus,
          phaseDeliveryDate,
          unitCode,
          unitType: unitType!,
          areaSqm: areaSqm!,
          bedrooms,
          bathrooms,
          floor: this.optionalString(row.floor),
          view: this.optionalString(row.view),
          finishing,
          basePrice: basePrice!,
          currency: this.optionalString(row.currency) ?? 'EGP',
          unitStatus,
          visibility,
          planName: this.optionalString(row.planName),
          downPaymentPercent,
          years,
          installmentFrequency: this.optionalString(row.installmentFrequency),
        };

    return { normalized, errors, warnings };
  }

  private extractRows(
    dto: PreviewProjectInventoryImportDto,
    sourceFormat: ImportSourceFormat,
  ) {
    if (sourceFormat === 'XLSX') {
      throw new BadRequestException('XLSX binary parsing is not supported in Slice 1. Send parsed rows as JSON.');
    }

    if (sourceFormat === 'CSV') {
      const csv = this.optionalString(dto.csv);
      if (!csv) {
        throw new BadRequestException('csv is required when sourceFormat is CSV.');
      }
      return this.parseCsv(csv);
    }

    if (!Array.isArray(dto.rows)) {
      throw new BadRequestException('rows must be an array.');
    }

    if (!dto.rows.length) {
      throw new BadRequestException('rows must include at least one row.');
    }

    return dto.rows;
  }

  private parseCsv(csv: string) {
    const records = this.parseCsvRecords(csv);
    if (records.length < 2) {
      throw new BadRequestException('csv must include a header row and at least one data row.');
    }

    const headers = records[0].map((header) => header.trim());
    return records.slice(1).map((record) =>
      headers.reduce<Record<string, string>>((row, header, index) => {
        row[header] = record[index] ?? '';
        return row;
      }, {}),
    );
  }

  private parseCsvRecords(csv: string) {
    const records: string[][] = [];
    let record: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < csv.length; index += 1) {
      const char = csv[index];
      const next = csv[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        record.push(field);
        field = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          index += 1;
        }
        record.push(field);
        if (record.some((value) => value.trim())) {
          records.push(record);
        }
        record = [];
        field = '';
      } else {
        field += char;
      }
    }

    record.push(field);
    if (record.some((value) => value.trim())) {
      records.push(record);
    }

    return records;
  }

  private normalizeKeys(row: ImportRowInput) {
    const aliases: Record<string, string> = {
      projectname: 'projectName',
      project_name: 'projectName',
      projectslug: 'projectSlug',
      project_slug: 'projectSlug',
      projecttype: 'projectType',
      project_type: 'projectType',
      projectstatus: 'projectStatus',
      project_status: 'projectStatus',
      projectvisibility: 'projectVisibility',
      project_visibility: 'projectVisibility',
      deliverydate: 'deliveryDate',
      delivery_date: 'deliveryDate',
      phasename: 'phaseName',
      phase_name: 'phaseName',
      phasestatus: 'phaseStatus',
      phase_status: 'phaseStatus',
      phasedeliverydate: 'phaseDeliveryDate',
      phase_delivery_date: 'phaseDeliveryDate',
      unitcode: 'unitCode',
      unit_code: 'unitCode',
      unitnumber: 'unitCode',
      unit_number: 'unitCode',
      unittype: 'unitType',
      unit_type: 'unitType',
      areasqm: 'areaSqm',
      area_sqm: 'areaSqm',
      baseprice: 'basePrice',
      base_price: 'basePrice',
      unitstatus: 'unitStatus',
      unit_status: 'unitStatus',
      planname: 'planName',
      plan_name: 'planName',
      downpaymentpercent: 'downPaymentPercent',
      down_payment_percent: 'downPaymentPercent',
      years: 'years',
      installmentfrequency: 'installmentFrequency',
      installment_frequency: 'installmentFrequency',
      roletitle: 'roleTitle',
      role_title: 'roleTitle',
      departmentid: 'departmentId',
      department_id: 'departmentId',
      employeeid: 'employeeId',
      employee_id: 'employeeId',
      checkinat: 'checkInAt',
      check_in_at: 'checkInAt',
      checkoutat: 'checkOutAt',
      check_out_at: 'checkOutAt',
      occurredat: 'occurredAt',
      occurred_at: 'occurredAt',
      categoryid: 'categoryId',
      category_id: 'categoryId',
      relatedprojectid: 'relatedProjectId',
      related_project_id: 'relatedProjectId',
      budgetamount: 'budgetAmount',
      budget_amount: 'budgetAmount',
      externalaccountid: 'externalAccountId',
      external_account_id: 'externalAccountId',
      externalcampaignid: 'externalCampaignId',
      external_campaign_id: 'externalCampaignId',
      aienabled: 'aiEnabled',
      ai_enabled: 'aiEnabled',
      projectid: 'projectId',
      project_id: 'projectId',
      streamurl: 'streamUrl',
      stream_url: 'streamUrl',
      streamurlmasked: 'streamUrlMasked',
      stream_url_masked: 'streamUrlMasked',
    };

    return Object.entries(row).reduce<Record<string, unknown>>((result, [key, value]) => {
      const normalizedKey = aliases[key.trim().replace(/[\s-]+/g, '_').toLowerCase()] ?? key;
      result[normalizedKey] = value;
      return result;
    }, {});
  }

  private importJobScopeWhere(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      if (!currentUser.permissions?.includes('exports.platform_data')) {
        throw new ForbiddenException('Missing exports.platform_data permission.');
      }
      return {};
    }

    return { organizationId: requireCurrentOrganizationId(currentUser) };
  }

  private async requireDeveloperImportScope(currentUser: AuthenticatedRequestUser) {
    if (!currentUser.permissions?.includes('imports.project_inventory')) {
      throw new ForbiddenException('Missing imports.project_inventory permission.');
    }

    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Platform import on behalf is not enabled in Slice 1.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType !== 'DEVELOPER') {
      throw new ForbiddenException('Only developer organizations can import project inventory.');
    }

    return organizationId;
  }

  private async assertCanCommitJob(
    organizationId: string,
    currentUser: AuthenticatedRequestUser,
    jobType: ImportJobType,
  ) {
    if (jobType === 'PROJECT_INVENTORY' && !currentUser.permissions?.includes('imports.project_inventory')) {
      throw new ForbiddenException('Missing imports.project_inventory permission.');
    }
    if (jobType !== 'PROJECT_INVENTORY') {
      this.assertOperationsImportPermission(currentUser, jobType as OperationsImportType);
    }

    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Platform import on behalf is not enabled in Slice 1.');
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      currentUser.organizationId !== organizationId
    ) {
      throw new ForbiddenException('Cannot commit another organization import job.');
    }
  }

  private assertOperationsImportPermission(currentUser: AuthenticatedRequestUser, type: OperationsImportType) {
    const specificPermission = OPERATIONS_IMPORT_PERMISSIONS[type];
    if (
      !currentUser.permissions?.includes(specificPermission) &&
      !currentUser.permissions?.includes('imports.project_inventory')
    ) {
      throw new ForbiddenException(`Missing ${specificPermission} permission.`);
    }
  }

  private assertExportOrganizationPermission(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      if (!currentUser.permissions?.includes('exports.platform_data')) {
        throw new ForbiddenException('Missing exports.platform_data permission.');
      }
      return;
    }

    if (!currentUser.permissions?.includes('exports.organization_data')) {
      throw new ForbiddenException('Missing exports.organization_data permission.');
    }
    requireCurrentOrganizationId(currentUser);
  }

  private developerScopedWhere(
    currentUser: AuthenticatedRequestUser,
    field: 'developerId',
  ) {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    if (currentUser.organizationType !== 'DEVELOPER') {
      return { [field]: '__no_developer_scope__' };
    }

    return { [field]: requireCurrentOrganizationId(currentUser) };
  }

  private dealScopedWhere(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === 'DEVELOPER') {
      return { developerId: organizationId };
    }
    if (currentUser.organizationType === 'BROKERAGE') {
      return { brokerageId: organizationId };
    }
    return { id: '__no_deal_scope__' };
  }

  private commissionScopedWhere(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === 'DEVELOPER') {
      return { developerId: organizationId };
    }
    if (currentUser.organizationType === 'BROKERAGE') {
      return {
        OR: [
          { brokerageId: organizationId },
          { recipientOrganizationId: organizationId },
        ],
      };
    }
    return { id: '__no_commission_scope__' };
  }

  private exportScope(currentUser: AuthenticatedRequestUser) {
    return isPlatformUser(currentUser)
      ? { kind: 'PLATFORM' }
      : { kind: 'ORGANIZATION', organizationId: currentUser.organizationId };
  }

  private safeOrganizationSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      type: true,
      country: true,
      city: true,
      status: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private safeUserSelect() {
    return {
      id: true,
      organizationId: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      userRole: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  private parseSourceFormat(value: unknown): ImportSourceFormat {
    const sourceFormat = this.optionalString(value) ?? 'JSON';
    if (!Object.values(ImportSourceFormat).includes(sourceFormat as ImportSourceFormat)) {
      throw new BadRequestException('sourceFormat is invalid.');
    }
    return sourceFormat as ImportSourceFormat;
  }

  private requiredString(
    row: Record<string, unknown>,
    field: string,
    errors: RowIssue[],
  ) {
    const value = this.optionalString(row[field]);
    if (!value) {
      errors.push({ field, message: `${field} is required.` });
    }
    return value;
  }

  private enumValue<T extends Record<string, string>>(
    value: unknown,
    values: T,
    field: string,
    errors: RowIssue[],
    optional = false,
  ) {
    const normalized = this.optionalString(value)?.toUpperCase();
    if (!normalized) {
      if (!optional) {
        errors.push({ field, message: `${field} is required.` });
      }
      return undefined;
    }

    if (!Object.values(values).includes(normalized)) {
      errors.push({ field, message: `${field} is invalid.` });
      return undefined;
    }

    return normalized as T[keyof T];
  }

  private requiredNonNegativeNumber(
    value: unknown,
    field: string,
    errors: RowIssue[],
  ) {
    const parsed = this.toNumber(value);
    if (parsed === undefined) {
      errors.push({ field, message: `${field} is required.` });
      return undefined;
    }
    if (parsed < 0) {
      errors.push({ field, message: `${field} must be a non-negative number.` });
      return undefined;
    }
    return parsed;
  }

  private optionalNonNegativeNumber(
    value: unknown,
    field: string,
    errors: RowIssue[],
  ) {
    const parsed = this.toNumber(value);
    if (parsed === undefined) {
      return undefined;
    }
    if (parsed < 0) {
      errors.push({ field, message: `${field} must be a non-negative number.` });
      return undefined;
    }
    return parsed;
  }

  private optionalNonNegativeInteger(
    value: unknown,
    field: string,
    errors: RowIssue[],
  ) {
    const parsed = this.optionalNonNegativeNumber(value, field, errors);
    if (parsed === undefined) {
      return undefined;
    }
    if (!Number.isInteger(parsed)) {
      errors.push({ field, message: `${field} must be an integer.` });
      return undefined;
    }
    return parsed;
  }

  private optionalPercent(value: unknown, field: string, errors: RowIssue[]) {
    const parsed = this.optionalNonNegativeNumber(value, field, errors);
    if (parsed !== undefined && parsed > 100) {
      errors.push({ field, message: `${field} must be between 0 and 100.` });
      return undefined;
    }
    return parsed;
  }

  private optionalDateString(
    value: unknown,
    field: string,
    errors: RowIssue[],
  ) {
    const stringValue = this.optionalString(value);
    if (!stringValue) {
      return undefined;
    }

    if (Number.isNaN(new Date(stringValue).getTime())) {
      errors.push({ field, message: `${field} is invalid.` });
      return undefined;
    }

    return stringValue;
  }

  private toDate(value: string | undefined) {
    return value ? new Date(value) : undefined;
  }

  private toNumber(value: unknown) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed =
      typeof value === 'number'
        ? value
        : Number(String(value).trim().replace(/,/g, ''));

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private optionalString(value: unknown) {
    const trimmed = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
    return trimmed || undefined;
  }

  private optionalBoolean(value: unknown) {
    if (typeof value === 'boolean') return value;
    const text = this.optionalString(value)?.toLowerCase();
    if (!text) return undefined;
    if (['true', '1', 'yes', 'y'].includes(text)) return true;
    if (['false', '0', 'no', 'n'].includes(text)) return false;
    return undefined;
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `project-${Date.now()}`;
  }
}
