"use client";

import { ImportRowStatusBadge } from "@/components/admin-import-export/badges";
import { DataTable } from "@/components/tables/data-table";
import type { ImportJobRow, ImportPreviewResponse } from "@/types/admin-import-export";

type PreviewIssueRow = {
  id: string;
  rowNumber: number;
  type: "ERROR" | "WARNING";
  issues: Array<{ field?: string; message?: string }>;
};

export function ImportRowErrorsTable({
  preview,
  rows,
}: {
  preview?: ImportPreviewResponse | null;
  rows?: ImportJobRow[];
}) {
  if (rows) {
    return (
      <DataTable<ImportJobRow>
        columns={[
          { key: "rowNumber", header: "Row", cell: (row) => row.rowNumber },
          { key: "status", header: "Status", cell: (row) => <ImportRowStatusBadge status={row.status} /> },
          { key: "errors", header: "Errors", cell: (row) => issueList(row.errors) },
          { key: "warnings", header: "Warnings", cell: (row) => issueList(row.warnings) },
          { key: "normalizedData", header: "Normalized data", cell: (row) => compactJson(row.normalizedData) },
        ]}
        data={rows}
        emptyTitle="No import rows"
        emptyDescription="Rows are created when an import preview succeeds."
      />
    );
  }

  const issueRows = [
    ...(preview?.rowErrors ?? []).map((row) => ({
      id: `error-${row.rowNumber}`,
      rowNumber: row.rowNumber,
      type: "ERROR" as const,
      issues: row.errors,
    })),
    ...(preview?.warnings ?? []).map((row) => ({
      id: `warning-${row.rowNumber}`,
      rowNumber: row.rowNumber,
      type: "WARNING" as const,
      issues: row.warnings,
    })),
  ];

  return (
    <DataTable<PreviewIssueRow>
      columns={[
        { key: "rowNumber", header: "Row", cell: (row) => row.rowNumber },
        { key: "type", header: "Type", cell: (row) => row.type },
        { key: "issues", header: "Issues", cell: (row) => issueList(row.issues) },
      ]}
      data={issueRows}
      emptyTitle="No row issues"
      emptyDescription="Validation errors and warnings will appear here after preview."
    />
  );
}

function issueList(issues?: Array<{ field?: string; message?: string }> | null) {
  if (!issues?.length) return "None";
  return (
    <ul className="space-y-1">
      {issues.map((issue, index) => (
        <li key={`${issue.field ?? "issue"}-${index}`} className="text-sm text-zinc-700">
          {issue.field ? <span className="font-medium text-zinc-950">{issue.field}: </span> : null}
          {issue.message ?? JSON.stringify(issue)}
        </li>
      ))}
    </ul>
  );
}

function compactJson(value: unknown) {
  if (!value) return "Not set";
  return (
    <code className="block max-w-md truncate rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
      {JSON.stringify(value)}
    </code>
  );
}
