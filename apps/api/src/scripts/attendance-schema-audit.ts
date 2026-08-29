import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadEnvironment } from '../config/load-environment';
import { EnvService } from '../config/env.service';
import { PrismaService } from '../modules/database/prisma.service';

type CatalogColumn = {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
};

loadEnvironment();

async function main() {
  const prisma = new PrismaService(new EnvService());

  try {
    const modelNames = ['OrganizationAttendanceSettings', 'HrAttendanceRecord'];
    const matrix: Array<Record<string, unknown>> = [];

    for (const modelName of modelNames) {
      const model = Prisma.dmmf.datamodel.models.find(
        (candidate) => candidate.name === modelName,
      );
      if (!model) throw new Error(`Prisma model not found: ${modelName}`);

      const tableName = model.dbName ?? model.name;
      const columns = await prisma.$queryRawUnsafe<CatalogColumn[]>(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = $1
         ORDER BY ordinal_position`,
        tableName,
      );
      const columnsByName = new Map(
        columns.map((column) => [column.column_name, column]),
      );

      for (const field of model.fields.filter(
        (field) => field.kind !== 'object',
      )) {
        const dbColumn = field.dbName ?? field.name;
        const column = columnsByName.get(dbColumn);
        matrix.push({
          model: modelName,
          prismaField: field.name,
          dbColumn,
          exists: Boolean(column),
          dbType: column?.data_type ?? null,
          dbUdt: column?.udt_name ?? null,
          dbNullable: column?.is_nullable ?? null,
          dbDefault: column?.column_default ?? null,
          expectedType: field.type,
          expectedList: field.isList,
          expectedRequired: field.isRequired,
          expectedDefault: field.hasDefaultValue,
        });
      }
    }

    const enums = await prisma.$queryRawUnsafe(
      `SELECT t.typname AS enum_name,
              string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS values
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       WHERE t.typname IN ('AttendanceEntryChannel', 'MissingAttendanceDisposition')
       GROUP BY t.typname
       ORDER BY t.typname`,
    );
    const migrations = await prisma.$queryRawUnsafe<
      Array<{
        migration_name: string;
        checksum: string;
        started_at: Date;
        finished_at: Date | null;
        rolled_back_at: Date | null;
        applied_steps_count: number;
      }>
    >(
      `SELECT migration_name, checksum, started_at, finished_at,
              rolled_back_at, applied_steps_count
       FROM _prisma_migrations
       ORDER BY started_at`,
    );
    const historicalFingerprint = await prisma.$queryRawUnsafe(
      `SELECT count(*)::text AS row_count,
              min(date)::text AS min_date,
              max(date)::text AS max_date,
              md5(coalesce(string_agg(
                md5(concat_ws('|', id, "organizationId", "employeeId", date::text,
                  coalesce("checkInAt"::text, ''), coalesce("checkOutAt"::text, ''),
                  status::text, coalesce(note, ''))),
                '' ORDER BY id), '')) AS checksum
       FROM hr_attendance_records`,
    );
    const settingsFingerprint = await prisma.$queryRawUnsafe(
      `SELECT count(*)::text AS row_count,
              md5(coalesce(string_agg(
                md5(concat_ws('|', id, "organizationId", "workStartTime",
                  "workEndTime", "gracePeriodMinutes"::text,
                  "autoCloseGraceMinutes"::text)),
                '' ORDER BY id), '')) AS checksum
       FROM organization_attendance_settings`,
    );
    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const migrationChecksumStatus = migrations.map((migration) => {
      const migrationPath = join(
        migrationsRoot,
        migration.migration_name,
        'migration.sql',
      );
      const localChecksum = existsSync(migrationPath)
        ? createHash('sha256').update(readFileSync(migrationPath)).digest('hex')
        : null;

      return {
        migrationName: migration.migration_name,
        localFileExists: Boolean(localChecksum),
        checksumMatches: localChecksum === migration.checksum,
        finished: Boolean(migration.finished_at),
        rolledBack: Boolean(migration.rolled_back_at),
      };
    });

    process.stdout.write(
      `${JSON.stringify(
        {
          matrix,
          enums,
          migrationChecksumStatus,
          historicalFingerprint,
          settingsFingerprint,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
