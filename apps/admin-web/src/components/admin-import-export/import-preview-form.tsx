"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Copy } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImportRowErrorsTable } from "@/components/admin-import-export/import-row-errors-table";
import { ImportSummaryCard } from "@/components/admin-import-export/import-summary-card";
import { JsonPreviewBlock } from "@/components/admin-import-export/json-preview-block";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCommitImportJob, usePreviewProjectInventoryImport } from "@/hooks/use-admin-import-export";
import type { ImportSourceFormat } from "@/types/admin-import-export";

const sampleRows = [
  {
    projectName: "Northline Residences",
    projectSlug: "northline-residences",
    projectType: "COMPOUND",
    city: "Cairo",
    district: "New Cairo",
    projectStatus: "ACTIVE",
    projectVisibility: "OPEN_MARKETPLACE",
    phaseName: "Phase 1",
    unitCode: "A-101",
    unitType: "APARTMENT",
    areaSqm: 120,
    bedrooms: 2,
    bathrooms: 2,
    basePrice: 2500000,
    currency: "EGP",
    planName: "Launch Plan",
    downPaymentPercent: 10,
    years: 7,
    installmentFrequency: "quarterly",
  },
];

const sampleCsv =
  "projectName,projectSlug,projectType,city,district,projectStatus,projectVisibility,phaseName,unitCode,unitType,areaSqm,bedrooms,bathrooms,basePrice,currency,planName,downPaymentPercent,years,installmentFrequency\n" +
  "Northline Residences,northline-residences,COMPOUND,Cairo,New Cairo,ACTIVE,OPEN_MARKETPLACE,Phase 1,A-101,APARTMENT,120,2,2,2500000,EGP,Launch Plan,10,7,quarterly";

const schema = z.object({
  sourceFormat: z.enum(["CSV", "JSON"]),
  originalFileName: z.string().optional(),
  csv: z.string().optional(),
  rowsJson: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function ImportPreviewForm({ jobsBasePath }: { jobsBasePath: string }) {
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceFormat, setSourceFormat] = useState<Extract<ImportSourceFormat, "CSV" | "JSON">>("JSON");
  const preview = usePreviewProjectInventoryImport();
  const commit = useCommitImportJob();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceFormat: "JSON",
      originalFileName: "inventory-import.json",
      rowsJson: JSON.stringify(sampleRows, null, 2),
      csv: sampleCsv,
    },
  });
  const sourceFormatField = register("sourceFormat");
  const previewData = preview.data;

  async function submit(values: Values) {
    setParseError(null);
    if (values.sourceFormat === "CSV") {
      await preview.mutateAsync({
        sourceFormat: "CSV",
        originalFileName: values.originalFileName,
        csv: values.csv,
      });
      return;
    }

    let rows: Array<Record<string, unknown>>;
    try {
      const parsed = JSON.parse(values.rowsJson || "[]") as unknown;
      rows = Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [];
    } catch {
      setParseError("JSON rows must be a valid array.");
      return;
    }
    if (!rows.length) {
      setParseError("JSON rows must include at least one row.");
      return;
    }
    await preview.mutateAsync({
      sourceFormat: "JSON",
      originalFileName: values.originalFileName,
      rows,
    });
  }

  return (
    <div className="space-y-6">
      <DetailCard title="Preview project and inventory import">
        <form className="space-y-5" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label>Source format</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                {...sourceFormatField}
                onChange={(event) => {
                  sourceFormatField.onChange(event);
                  setSourceFormat(event.target.value as Extract<ImportSourceFormat, "CSV" | "JSON">);
                }}
              >
                <option value="JSON">JSON rows</option>
                <option value="CSV">CSV text</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Original file name</Label>
              <Input placeholder="inventory-import.csv" {...register("originalFileName")} />
            </div>
          </div>
          {sourceFormat === "CSV" ? (
            <div className="space-y-2">
              <Label>CSV text</Label>
              <Textarea className="min-h-72 font-mono text-xs" {...register("csv")} />
              {errors.csv ? <p className="text-sm text-red-600">{errors.csv.message}</p> : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>JSON rows</Label>
              <Textarea className="min-h-72 font-mono text-xs" {...register("rowsJson")} />
              {errors.rowsJson ? <p className="text-sm text-red-600">{errors.rowsJson.message}</p> : null}
            </div>
          )}
          {parseError || preview.error ? (
            <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{parseError ?? preview.error?.message}</span>
            </div>
          ) : null}
          <Button disabled={preview.isPending} type="submit">{preview.isPending ? "Previewing" : "Preview import"}</Button>
        </form>
      </DetailCard>

      <DetailCard
        title="Template helper"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2 bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => setValue("rowsJson", JSON.stringify(sampleRows, null, 2))}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Use JSON sample
            </Button>
            <Button className="gap-2 bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => setValue("csv", sampleCsv)}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              Use CSV sample
            </Button>
          </div>
        }
      >
        <JsonPreviewBlock value={sourceFormat === "CSV" ? sampleCsv : sampleRows} />
      </DetailCard>

      {previewData ? (
        <>
          <ImportSummaryCard
            jobsBasePath={jobsBasePath}
            preview={previewData}
            commitResult={commit.data}
            isCommitting={commit.isPending}
            onCommit={(id) => commit.mutateAsync(id)}
          />
          {commit.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{commit.error.message}</p> : null}
          <DetailCard title="Row validation">
            <ImportRowErrorsTable preview={previewData} />
          </DetailCard>
        </>
      ) : null}
    </div>
  );
}
