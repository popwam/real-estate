import { loadEnvironment } from '../config/load-environment';

export type EnvironmentCheck = {
  ok: boolean;
  lines: string[];
};

export function inspectEnvironment(): EnvironmentCheck {
  loadEnvironment();
  const lines: string[] = [];
  let ok = true;
  const present = (key: string, label = key) => {
    const exists = Boolean(process.env[key]?.trim());
    lines.push(`${label}: ${exists ? 'present' : 'MISSING'}`);
    if (!exists) ok = false;
    return exists;
  };

  const databasePresent = present('DATABASE_URL');
  if (databasePresent) {
    try {
      const databaseUrl = new URL(process.env.DATABASE_URL!);
      const protocolOk = ['postgres:', 'postgresql:'].includes(databaseUrl.protocol);
      lines.push(`Database protocol: ${protocolOk ? databaseUrl.protocol.slice(0, -1) : 'INVALID'}`);
      lines.push(`Database host: ${databaseUrl.hostname || 'INVALID'}`);
      if (!protocolOk || !databaseUrl.hostname) ok = false;
    } catch {
      lines.push('Database protocol: INVALID');
      lines.push('Database host: INVALID');
      ok = false;
    }
  }

  lines.push(`NODE_ENV: ${(process.env.NODE_ENV || 'development').trim()}`);
  presentAny(['JWT_SECRET', 'JWT_ACCESS_SECRET'], 'JWT access secret');
  present('JWT_REFRESH_SECRET', 'JWT refresh secret');
  const provider = (process.env.FILE_STORAGE_PROVIDER || 'local').trim().toLowerCase();
  lines.push(`File storage provider: ${provider}`);
  if (!['local', 's3', 'r2'].includes(provider)) ok = false;
  if (provider !== 'local') {
    presentAny(['R2_ENDPOINT', 'FILE_STORAGE_ENDPOINT'], 'R2 endpoint');
    for (const prefix of [
      'PUBLIC_MEDIA',
      'PROJECT_MEDIA',
      'COMPANY_DOCUMENTS',
      'CHAT_ATTACHMENTS',
      'HR_DOCUMENTS',
      'ATTENDANCE_EVIDENCE',
      'QUARANTINE_UPLOADS',
    ]) {
      present(`R2_${prefix}_BUCKET`);
      present(`R2_${prefix}_ACCESS_KEY_ID`);
      present(`R2_${prefix}_SECRET_ACCESS_KEY`);
    }
  } else {
    lines.push('R2 purpose-specific configuration: not required for local provider');
  }

  const extractionProvider = (process.env.DOCUMENT_EXTRACTION_PROVIDER || 'NONE').trim();
  lines.push(`Document extraction provider: ${extractionProvider}`);
  if (extractionProvider === 'CLOUDFLARE_WORKERS_AI') {
    present('CLOUDFLARE_ACCOUNT_ID');
    present('CLOUDFLARE_API_TOKEN');
    present('CLOUDFLARE_AI_GATEWAY_ID');
  }
  const corsPresent = Boolean(
    process.env.CORS_ORIGINS?.trim() || process.env.CORS_ALLOWED_SUFFIXES?.trim(),
  );
  lines.push(`CORS configuration: ${corsPresent ? 'present' : 'MISSING'}`);
  if (!corsPresent && process.env.NODE_ENV === 'production') ok = false;

  function presentAny(keys: string[], label: string) {
    const exists = keys.some((key) => Boolean(process.env[key]?.trim()));
    lines.push(`${label}: ${exists ? 'present' : 'MISSING'}`);
    if (!exists) ok = false;
  }

  return { ok, lines };
}

if (require.main === module) {
  const result = inspectEnvironment();
  for (const line of result.lines) console.log(line);
  console.log(`Environment readiness: ${result.ok ? 'GO' : 'NO-GO'}`);
  if (!result.ok) process.exitCode = 1;
}
