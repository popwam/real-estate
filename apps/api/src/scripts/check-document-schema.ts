import { Client } from 'pg';
import { loadEnvironment } from '../config/load-environment';

type ExpectedTable = Record<string, string[]>;

// Keep this intentionally narrow and read-only: it is safe to execute via
// `railway run` and never prints the connection string or document data.
const expected: ExpectedTable = {
  uploaded_files: ['id', 'organizationId', 'uploadedById', 'filePurpose', 'bucket', 'objectKey', 'url', 'mimeType', 'sizeBytes', 'visibility', 'checksum', 'createdAt'],
  organization_documents: ['id', 'organizationId', 'documentType', 'fileId', 'status', 'expiresAt', 'issuedAt', 'issuingAuthority', 'extractedData', 'extractionProvider', 'extractionStatus', 'extractionMessage', 'reviewedById', 'reviewedAt', 'createdAt', 'updatedAt'],
  organization_owners: ['id', 'organizationId', 'idFrontFileId', 'idBackFileId', 'passportFileId', 'proofFileId', 'verificationStatus', 'createdAt', 'updatedAt'],
  organization_verifications: ['id', 'organizationId', 'documentType', 'uploadedFileId', 'documentUrl', 'expiryDate', 'status', 'verifiedById', 'verifiedAt', 'rejectionReason', 'notes', 'createdAt', 'updatedAt'],
};

async function main() {
  loadEnvironment();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is unavailable.');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const rows = await client.query<{
      table_name: string; column_name: string; data_type: string;
      is_nullable: string; column_default: string | null; udt_name: string;
    }>(`
      SELECT table_name, column_name, data_type, is_nullable, column_default, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])
      ORDER BY table_name, ordinal_position
    `, [Object.keys(expected)]);
    const byTable = new Map<string, typeof rows.rows>();
    for (const row of rows.rows) byTable.set(row.table_name, [...(byTable.get(row.table_name) ?? []), row]);

    const report = Object.entries(expected).map(([table, columns]) => {
      const actual = byTable.get(table) ?? [];
      const actualNames = new Set(actual.map((column) => column.column_name));
      return {
        table,
        exists: actual.length > 0,
        missingColumns: columns.filter((column) => !actualNames.has(column)),
        columns: actual.map(({ column_name, data_type, udt_name, is_nullable, column_default }) => ({ column: column_name, type: data_type, udt: udt_name, nullable: is_nullable === 'YES', hasDefault: column_default !== null })),
      };
    });
    const migrations = await client.query<{ migration_name: string; finished_at: Date | null }>(`
      SELECT migration_name, finished_at FROM "_prisma_migrations"
      WHERE migration_name LIKE '%document%' OR migration_name LIKE '%provisioning%'
      ORDER BY finished_at NULLS LAST
    `);
    console.log(JSON.stringify({ documentSchema: report, relevantMigrations: migrations.rows.map((row) => ({ migration: row.migration_name, applied: row.finished_at !== null })) }, null, 2));
    if (report.some((table) => !table.exists || table.missingColumns.length)) process.exitCode = 2;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const value = error as { code?: string; table?: string; column?: string };
  console.error(JSON.stringify({ code: value.code ?? 'SCHEMA_CHECK_FAILED', table: value.table, column: value.column }));
  process.exitCode = 1;
});
