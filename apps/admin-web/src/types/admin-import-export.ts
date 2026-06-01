import type { Organization } from "@/types/platform";

export type ImportJobType = "PROJECT_INVENTORY";
export type ImportJobStatus = "DRAFT" | "VALIDATING" | "READY" | "COMMITTED" | "FAILED" | "CANCELLED";
export type ImportSourceFormat = "CSV" | "JSON" | "XLSX";
export type ImportRowStatus = "VALID" | "INVALID" | "SKIPPED" | "COMMITTED";
export type ExportDataType = "projects" | "inventory" | "deals" | "commissions" | "account";

export type ImportRowIssue = {
  field?: string;
  message?: string;
};

export type ImportPreviewPayload = {
  sourceFormat: Extract<ImportSourceFormat, "CSV" | "JSON">;
  originalFileName?: string;
  rows?: Array<Record<string, unknown>>;
  csv?: string;
};

export type ImportPreviewResponse = {
  jobId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rowErrors: Array<{ rowNumber: number; errors: ImportRowIssue[] }>;
  warnings: Array<{ rowNumber: number; warnings: ImportRowIssue[] }>;
};

export type ImportJobRow = {
  id: string;
  importJobId: string;
  rowNumber: number;
  rawData: Record<string, unknown>;
  normalizedData?: Record<string, unknown> | null;
  status: ImportRowStatus;
  errors?: ImportRowIssue[] | null;
  warnings?: ImportRowIssue[] | null;
  createdAt: string;
  updatedAt: string;
};

export type ImportJob = {
  id: string;
  organizationId: string;
  createdByUserId: string;
  type: ImportJobType;
  status: ImportJobStatus;
  originalFileName?: string | null;
  sourceFormat: ImportSourceFormat;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  summary?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  committedAt?: string | null;
  organization?: Organization | null;
  createdBy?: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  rows?: ImportJobRow[];
};

export type ImportCommitResponse = {
  jobId: string;
  status: ImportJobStatus;
  alreadyCommitted?: boolean;
  summary?: Record<string, unknown> | null;
  projectsCreated?: number;
  projectsUpdated?: number;
  phasesCreated?: number;
  phasesUpdated?: number;
  unitsCreated?: number;
  unitsUpdated?: number;
  paymentPlansCreated?: number;
  paymentPlansUpdated?: number;
  rowsCommitted?: number;
  rowsSkipped?: number;
};

export type ExportResponse = {
  dataType: ExportDataType;
  scope: {
    kind: "ORGANIZATION" | "PLATFORM";
    organizationId?: string | null;
  };
  data: unknown;
};
