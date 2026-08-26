import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OperationsService } from '../modules/operations/operations.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const attendance = app.get(OperationsService);
    const [autoClose, missingAttendance] = await Promise.all([
      attendance.autoCloseOpenAttendanceRecords(),
      attendance.reconcileMissingAttendanceRecords(),
    ]);
    // Aggregate counts only: no GPS, photos, names, or full IDs.
    console.info('[attendance:auto-close] complete', { autoClose, missingAttendance });
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error('[attendance:auto-close] failed', {
    message: error instanceof Error ? error.message : 'unknown error',
  });
  process.exitCode = 1;
});
