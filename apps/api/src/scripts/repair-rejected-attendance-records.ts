import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { loadEnvironment } from '../config/load-environment';

async function main() {
  loadEnvironment();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is unavailable.');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const records = await prisma.hrAttendanceRecord.findMany({
      where: { verificationStatus: 'REJECTED', checkInAt: { not: null }, checkOutAt: null },
      select: { id: true, organizationId: true, employeeId: true, checkInAt: true, verificationFailureReasons: true, attendanceSource: true }, take: 1000,
    });
    console.log(JSON.stringify({ dryRun: process.env.CONFIRM_ATTENDANCE_REPAIR !== 'true', count: records.length, ids: records.slice(0, 20).map((r) => `${r.id.slice(0, 8)}…`) }));
    if (process.env.CONFIRM_ATTENDANCE_REPAIR === 'true') await prisma.$transaction(async (tx) => {
      for (const record of records) {
        await (tx as any).hrAttendanceAttempt.create({ data: { organizationId: record.organizationId, employeeId: record.employeeId, attemptedAt: record.checkInAt!, action: 'CHECK_IN', source: record.attendanceSource, decision: 'REJECTED_LEGACY', failureReasons: record.verificationFailureReasons } });
        await tx.hrAttendanceRecord.update({ where: { id: record.id }, data: { checkOutAt: record.checkInAt } });
      }
      console.log(JSON.stringify({ repaired: records.length }));
    });
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
