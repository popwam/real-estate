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
      select: { id: true }, take: 1000,
    });
    console.log(JSON.stringify({ dryRun: process.env.CONFIRM_ATTENDANCE_REPAIR !== 'true', count: records.length, ids: records.slice(0, 20).map((r) => `${r.id.slice(0, 8)}…`) }));
    if (process.env.CONFIRM_ATTENDANCE_REPAIR === 'true') {
      throw new Error('Confirmed repair is intentionally not automated: review the dry-run output and choose an archival policy first.');
    }
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
