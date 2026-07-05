type Check = {
  name: string;
  ok: boolean;
  message: string;
};

export type ReadinessResult = {
  ok: boolean;
  checks: Check[];
};

const SECRET_KEYS = new Set([
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FILE_STORAGE_ACCESS_KEY_ID',
  'FILE_STORAGE_SECRET_ACCESS_KEY',
]);

export function validateApiReadiness(
  env: NodeJS.ProcessEnv = process.env,
): ReadinessResult {
  const checks: Check[] = [];
  const provider = value(env.FILE_STORAGE_PROVIDER, 'local').toLowerCase();
  const objectStorage = provider === 's3' || provider === 'r2';

  requirePresent(checks, env, 'DATABASE_URL');
  requireAny(
    checks,
    env,
    ['JWT_SECRET', 'JWT_ACCESS_SECRET'],
    'JWT access secret',
  );
  requirePresent(checks, env, 'JWT_REFRESH_SECRET');
  requireAllowed(checks, 'FILE_STORAGE_PROVIDER', provider, [
    'local',
    's3',
    'r2',
  ]);

  if (objectStorage) {
    requirePresent(checks, env, 'FILE_STORAGE_BUCKET');
    requireAny(
      checks,
      env,
      ['FILE_STORAGE_REGION', 'FILE_STORAGE_ENDPOINT'],
      'FILE_STORAGE_REGION or FILE_STORAGE_ENDPOINT',
    );
    requirePresent(checks, env, 'FILE_STORAGE_ACCESS_KEY_ID');
    requirePresent(checks, env, 'FILE_STORAGE_SECRET_ACCESS_KEY');
  } else {
    add(checks, 'FILE_STORAGE_BUCKET', true, 'not required for local storage');
    add(
      checks,
      'FILE_STORAGE_REGION or FILE_STORAGE_ENDPOINT',
      true,
      'not required for local storage',
    );
    add(
      checks,
      'FILE_STORAGE_ACCESS_KEY_ID',
      true,
      'not required for local storage',
    );
    add(
      checks,
      'FILE_STORAGE_SECRET_ACCESS_KEY',
      true,
      'not required for local storage',
    );
  }

  requirePositiveNumber(checks, env, 'ATTENDANCE_PHOTO_FRESHNESS_MINUTES', 10);
  requireOptionalPositiveNumber(
    checks,
    env,
    'ATTENDANCE_EVIDENCE_RETENTION_DAYS',
  );

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

function value(input: string | undefined, fallback: string) {
  return input?.trim() || fallback;
}

function add(checks: Check[], name: string, ok: boolean, message: string) {
  checks.push({ name, ok, message });
}

function requirePresent(checks: Check[], env: NodeJS.ProcessEnv, key: string) {
  add(
    checks,
    key,
    Boolean(env[key]?.trim()),
    env[key]?.trim() ? 'configured' : 'missing',
  );
}

function requireAny(
  checks: Check[],
  env: NodeJS.ProcessEnv,
  keys: string[],
  label: string,
) {
  add(
    checks,
    label,
    keys.some((key) => Boolean(env[key]?.trim())),
    keys.some((key) => Boolean(env[key]?.trim())) ? 'configured' : 'missing',
  );
}

function requireAllowed(
  checks: Check[],
  name: string,
  actual: string,
  allowed: string[],
) {
  add(
    checks,
    name,
    allowed.includes(actual),
    allowed.includes(actual)
      ? `configured as ${actual}`
      : `unsupported value ${actual}`,
  );
}

function requirePositiveNumber(
  checks: Check[],
  env: NodeJS.ProcessEnv,
  key: string,
  fallback: number,
) {
  const raw = env[key]?.trim();
  const number = raw ? Number(raw) : fallback;
  add(
    checks,
    key,
    Number.isFinite(number) && number > 0,
    Number.isFinite(number) && number > 0
      ? raw
        ? 'configured'
        : `default ${fallback}`
      : 'must be a positive number',
  );
}

function requireOptionalPositiveNumber(
  checks: Check[],
  env: NodeJS.ProcessEnv,
  key: string,
) {
  const raw = env[key]?.trim();
  if (!raw) {
    add(checks, key, true, 'not configured');
    return;
  }
  const number = Number(raw);
  add(
    checks,
    key,
    Number.isFinite(number) && number > 0,
    Number.isFinite(number) && number > 0
      ? 'configured'
      : 'must be a positive number when set',
  );
}

function safeName(name: string) {
  return SECRET_KEYS.has(name) ? `${name} (secret value hidden)` : name;
}

if (require.main === module) {
  const result = validateApiReadiness();
  for (const check of result.checks) {
    const mark = check.ok ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${safeName(check.name)}: ${check.message}`);
  }
  if (!result.ok) {
    process.exitCode = 1;
  }
}
