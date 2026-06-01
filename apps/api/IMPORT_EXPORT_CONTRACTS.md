# POPWAM Import/Export Contracts

Stage 2 Import/Export Slice 1 adds a backend-only foundation for developer project/inventory imports and safe organization exports.

## Scope

Supported import inputs:

- CSV text payloads.
- JSON payloads containing already-parsed spreadsheet rows.

Not supported in Slice 1:

- Word import.
- PDF import.
- OCR.
- AI parsing.
- Binary file upload or cloud storage upload.
- XLSX binary parsing. XLSX can be added later only with a deliberate parser dependency and upload/storage design.

## Import Preview

`POST /import-export/project-inventory/preview`

Requires bearer auth and `imports.project_inventory`.

Only developer organizations can use this endpoint in Slice 1. Platform import-on-behalf is intentionally disabled until explicit platform permission and target-organization UX are added. Brokerage and broker users cannot import developer project data.

JSON row payload:

```json
{
  "sourceFormat": "JSON",
  "originalFileName": "inventory-export.xlsx",
  "rows": [
    {
      "projectName": "Northline Residences",
      "projectSlug": "northline-residences",
      "projectType": "COMPOUND",
      "city": "Cairo",
      "district": "New Cairo",
      "address": "Golden Square",
      "description": "Launch inventory",
      "projectStatus": "ACTIVE",
      "projectVisibility": "OPEN_MARKETPLACE",
      "deliveryDate": "2028-12-31",
      "phaseName": "Phase 1",
      "phaseStatus": "ACTIVE",
      "phaseDeliveryDate": "2028-06-30",
      "unitCode": "A-101",
      "unitType": "APARTMENT",
      "areaSqm": 120,
      "bedrooms": 2,
      "bathrooms": 2,
      "floor": "1",
      "view": "Garden",
      "finishing": "FULLY_FINISHED",
      "basePrice": 2500000,
      "currency": "EGP",
      "unitStatus": "AVAILABLE",
      "visibility": "INHERIT_PROJECT",
      "planName": "Launch Plan",
      "downPaymentPercent": 10,
      "years": 7,
      "installmentFrequency": "quarterly"
    }
  ]
}
```

CSV payload:

```json
{
  "sourceFormat": "CSV",
  "originalFileName": "inventory.csv",
  "csv": "projectName,projectType,city,district,unitType,areaSqm,basePrice\nNorthline,COMPOUND,Cairo,New Cairo,APARTMENT,120,2500000"
}
```

Response:

```json
{
  "jobId": "import_job_id",
  "totalRows": 3,
  "validRows": 2,
  "invalidRows": 1,
  "rowErrors": [
    {
      "rowNumber": 2,
      "errors": [
        { "field": "projectType", "message": "projectType is invalid." }
      ]
    }
  ],
  "warnings": [
    {
      "rowNumber": 3,
      "warnings": [
        { "field": "unitCode", "message": "unitCode missing; generated northline-unit-3." }
      ]
    }
  ]
}
```

Preview creates `ImportJob` and `ImportJobRow` records only. It must not create or mutate projects, phases, inventory units, or payment plans.

## Row Validation

Required project fields:

- `projectName`
- `projectType`
- `city`
- `district`

Optional project fields:

- `projectSlug`
- `address`
- `description`
- `projectStatus`, defaults to `DRAFT`
- `projectVisibility`, defaults to `PRIVATE`
- `deliveryDate`

Optional phase fields:

- `phaseName`
- `phaseStatus`
- `phaseDeliveryDate`

Required unit fields:

- `unitType`
- `areaSqm`
- `basePrice`

Optional unit fields:

- `unitCode`, generated when missing
- `bedrooms`
- `bathrooms`
- `floor`
- `view`
- `finishing`
- `currency`, defaults to `EGP`
- `unitStatus`, defaults to `AVAILABLE`
- `visibility`, defaults to `INHERIT_PROJECT`

Optional payment plan fields:

- `planName`
- `downPaymentPercent`
- `years`
- `installmentFrequency`

Validation is row-level. Invalid rows are stored with `status: INVALID` and error JSON. Valid rows are stored with normalized data and can be committed.

## Import Job Endpoints

`GET /import-export/jobs`

Lists import jobs scoped to the caller's organization. Platform users may list all only with `exports.platform_data`.

`GET /import-export/jobs/:id`

Returns the job and rows only when scoped to the caller's organization or allowed platform scope.

`POST /import-export/jobs/:id/commit`

Commits valid rows only. Invalid rows are not committed.

Commit behavior:

- Uses a Prisma transaction.
- Upserts projects by `developerId + projectSlug`.
- Finds or creates phases by project and phase name.
- Upserts inventory units by `projectId + unitCode`.
- Finds or creates project-level payment plans by project and plan name.
- Marks valid rows `COMMITTED`.
- Marks the job `COMMITTED` with a commit summary.
- Re-running commit on an already committed job returns `alreadyCommitted: true` and does not duplicate records.

`POST /import-export/jobs/:id/cancel`

Cancels `DRAFT`, `READY`, or `FAILED` jobs. Committed jobs cannot be cancelled.

## Export Endpoints

All export endpoints require bearer auth.

Organization users require `exports.organization_data` and receive only their own organization data. Platform users require `exports.platform_data` and can export all supported data.

Endpoints:

- `GET /import-export/export/projects`
- `GET /import-export/export/inventory`
- `GET /import-export/export/deals`
- `GET /import-export/export/commissions`
- `GET /import-export/export/account`

Responses are JSON in Slice 1:

```json
{
  "dataType": "projects",
  "scope": {
    "kind": "ORGANIZATION",
    "organizationId": "org_id"
  },
  "data": []
}
```

CSV export is a future convenience feature and is not part of Slice 1.

## Privacy Rules

Exports must not expose:

- password hashes
- refresh tokens
- token hashes
- private authentication metadata
- audit logs
- other organizations' data for organization-scoped users

`export/account` uses allowlisted organization/user fields. Domain verification exports omit verification tokens.

## Future Notes

Future slices may add:

- Admin Web import/export screens.
- CSV download formatting.
- import templates and sample files.
- platform import-on-behalf with explicit target organization controls.
- XLSX parsing if a dependency and upload/storage path are approved.
- background import workers for large files.

Word, PDF, OCR, AI parsing, and document extraction are future product areas and are intentionally outside this backend foundation.
