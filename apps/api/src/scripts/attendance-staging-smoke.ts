import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

type SmokeEnv = {
  STAGING_API_URL?: string;
  STAGING_TEST_IDENTIFIER?: string;
  STAGING_TEST_PASSWORD?: string;
  STAGING_TEST_PHOTO_PATH?: string;
};

const requiredEnv = [
  'STAGING_API_URL',
  'STAGING_TEST_IDENTIFIER',
  'STAGING_TEST_PASSWORD',
  'STAGING_TEST_PHOTO_PATH',
] as const;

export function validateAttendanceSmokeEnv(env: SmokeEnv) {
  return requiredEnv.filter((key) => !env[key]?.trim());
}

async function main() {
  const missing = validateAttendanceSmokeEnv(process.env);
  if (missing.length) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
    process.exitCode = 1;
    return;
  }

  const apiUrl = process.env.STAGING_API_URL!.replace(/\/$/, '');
  const photoPath = process.env.STAGING_TEST_PHOTO_PATH!;
  const token = await login(apiUrl);
  const fileId = await uploadPhoto(apiUrl, token, photoPath);
  await protectedPreview(apiUrl, token, fileId);
  await anonymousPreviewFails(apiUrl, fileId);
  await checkIn(apiUrl, token, fileId);
  await checkOut(apiUrl, token);
  console.log('[PASS] attendance staging smoke completed');
}

async function login(apiUrl: string) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: process.env.STAGING_TEST_IDENTIFIER,
      password: process.env.STAGING_TEST_PASSWORD,
    }),
  });
  assertOk(response, 'login');
  const body = (await response.json()) as {
    accessToken?: string;
    token?: string;
  };
  const token = body.accessToken ?? body.token;
  if (!token) throw new Error('Login did not return an access token.');
  return token;
}

async function uploadPhoto(apiUrl: string, token: string, photoPath: string) {
  const stats = statSync(photoPath);
  if (!stats.isFile() || stats.size <= 0) {
    throw new Error('STAGING_TEST_PHOTO_PATH must point to a non-empty file.');
  }
  const form = new FormData();
  const blob = new Blob([await streamToBuffer(createReadStream(photoPath))], {
    type: mimeTypeFor(photoPath),
  });
  form.append('file', blob, basename(photoPath));
  form.append('purpose', 'ATTENDANCE_CHECK_IN');

  const response = await fetch(`${apiUrl}/hr/attendance/evidence-photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  assertOk(response, 'attendance evidence photo upload');
  const body = (await response.json()) as { fileId?: string };
  if (!body.fileId) throw new Error('Upload did not return fileId.');
  console.log('[PASS] uploaded attendance evidence photo');
  return body.fileId;
}

async function protectedPreview(apiUrl: string, token: string, fileId: string) {
  const response = await fetch(
    `${apiUrl}/files/${encodeURIComponent(fileId)}/preview`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  assertOk(response, 'protected preview');
  console.log('[PASS] protected preview returned success with auth');
}

async function anonymousPreviewFails(apiUrl: string, fileId: string) {
  const response = await fetch(
    `${apiUrl}/files/${encodeURIComponent(fileId)}/preview`,
  );
  if (response.status !== 401 && response.status !== 403) {
    throw new Error(
      `Anonymous preview expected 401/403, received ${response.status}.`,
    );
  }
  console.log('[PASS] anonymous protected preview is blocked');
}

async function checkIn(apiUrl: string, token: string, fileId: string) {
  const response = await fetch(`${apiUrl}/hr/attendance/check-in`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      photoFileId: fileId,
      developerOptionsEnabled: false,
      usbDebuggingEnabled: false,
    }),
  });
  assertOk(response, 'attendance check-in');
  console.log('[PASS] check-in accepted');
}

async function checkOut(apiUrl: string, token: string) {
  const response = await fetch(`${apiUrl}/hr/attendance/check-out`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      developerOptionsEnabled: false,
      usbDebuggingEnabled: false,
    }),
  });
  assertOk(response, 'attendance check-out');
  console.log('[PASS] check-out accepted');
}

function assertOk(response: Response, label: string) {
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}.`);
  }
}

function mimeTypeFor(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
