import { Injectable } from '@nestjs/common';

type NodeEnv = 'development' | 'test' | 'production';

@Injectable()
export class EnvService {
  readonly nodeEnv: NodeEnv;
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly jwtRefreshSecret: string;
  readonly jwtRefreshExpiresIn: string;
  readonly corsOrigins: string[];
  readonly corsAllowedSuffixes: string[];

  constructor() {
    this.nodeEnv = this.parseNodeEnv(process.env.NODE_ENV);
    this.port = this.parsePort(process.env.PORT);
    this.databaseUrl = this.parseDatabaseUrl(process.env.DATABASE_URL);
    this.jwtSecret = this.parseSecret(
      process.env.JWT_SECRET ?? process.env.JWT_ACCESS_SECRET,
      'JWT_SECRET',
    );
    this.jwtExpiresIn = this.parseDuration(
      process.env.JWT_EXPIRES_IN ?? process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      'JWT_EXPIRES_IN',
    );
    this.jwtRefreshSecret = this.parseSecret(
      process.env.JWT_REFRESH_SECRET,
      'JWT_REFRESH_SECRET',
    );
    this.jwtRefreshExpiresIn = this.parseDuration(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
      'JWT_REFRESH_EXPIRES_IN',
    );
    this.corsOrigins = this.parseCsv(process.env.CORS_ORIGINS);
    this.corsAllowedSuffixes = this.parseCsv(
      process.env.CORS_ALLOWED_SUFFIXES ?? 'popwam.com,staging.popwam.com',
    );

    process.env.NODE_ENV = this.nodeEnv;
    process.env.PORT = String(this.port);
    process.env.DATABASE_URL = this.databaseUrl;
    process.env.JWT_SECRET = this.jwtSecret;
    process.env.JWT_EXPIRES_IN = this.jwtExpiresIn;
    process.env.JWT_REFRESH_SECRET = this.jwtRefreshSecret;
    process.env.JWT_REFRESH_EXPIRES_IN = this.jwtRefreshExpiresIn;
    process.env.COMPANY_PUBLIC_SITE_FALLBACK_PATH =
      process.env.COMPANY_PUBLIC_SITE_FALLBACK_PATH?.trim() || '/sites';
    process.env.ENABLE_WILDCARD_SUBDOMAINS =
      process.env.ENABLE_WILDCARD_SUBDOMAINS === 'true' ? 'true' : 'false';
    process.env.DOCUMENT_EXTRACTION_AUTO_RUN =
      process.env.DOCUMENT_EXTRACTION_AUTO_RUN === 'true' ? 'true' : 'false';

    this.validateStorageEnv();
    this.validateDocumentExtractionEnv();
  }

  private parseNodeEnv(value: string | undefined): NodeEnv {
    if (!value) {
      return 'development';
    }

    if (value === 'development' || value === 'test' || value === 'production') {
      return value;
    }

    throw new Error(
      'Invalid NODE_ENV. Expected development, test, or production.',
    );
  }

  private parsePort(value: string | undefined): number {
    if (!value) {
      return 3000;
    }

    const port = Number(value);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Invalid PORT. Expected an integer from 1 to 65535.');
    }

    return port;
  }

  private parseDatabaseUrl(value: string | undefined): string {
    const databaseUrl =
      value ??
      'postgresql://postgres:postgres@localhost:5432/popwam?schema=public';

    if (!databaseUrl.startsWith('postgresql://')) {
      throw new Error('Invalid DATABASE_URL. Expected a PostgreSQL URL.');
    }

    return databaseUrl;
  }

  private parseSecret(value: string | undefined, name: string): string {
    if (value?.trim()) {
      return value;
    }

    if (this.nodeEnv === 'production') {
      throw new Error(`${name} is required in production.`);
    }

    return `${name.toLowerCase()}-development-secret`;
  }

  private parseDuration(value: string, name: string): string {
    if (!value.match(/^\d+(s|m|h|d)$/)) {
      throw new Error(`${name} must look like 15m, 12h, or 30d.`);
    }

    return value;
  }

  private parseCsv(value: string | undefined) {
    return (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private validateStorageEnv() {
    const provider = (process.env.FILE_STORAGE_PROVIDER ?? 'local')
      .trim()
      .toLowerCase();
    if (!['local', 's3', 'r2'].includes(provider)) {
      throw new Error('Invalid FILE_STORAGE_PROVIDER. Expected local, s3, or r2.');
    }
    const wantsR2 = provider !== 'local';
    if (!wantsR2) return;

    this.requireAny(['R2_ENDPOINT', 'FILE_STORAGE_ENDPOINT'], 'R2 endpoint');
    this.requireAny(['R2_REGION', 'FILE_STORAGE_REGION'], 'R2 region');
    const purposeSecrets = [
      ['R2_PUBLIC_MEDIA_BUCKET', 'R2_PUBLIC_MEDIA_ACCESS_KEY_ID', 'R2_PUBLIC_MEDIA_SECRET_ACCESS_KEY'],
      ['R2_PROJECT_MEDIA_BUCKET', 'R2_PROJECT_MEDIA_ACCESS_KEY_ID', 'R2_PROJECT_MEDIA_SECRET_ACCESS_KEY'],
      ['R2_COMPANY_DOCUMENTS_BUCKET', 'R2_COMPANY_DOCUMENTS_ACCESS_KEY_ID', 'R2_COMPANY_DOCUMENTS_SECRET_ACCESS_KEY'],
      ['R2_CHAT_ATTACHMENTS_BUCKET', 'R2_CHAT_ATTACHMENTS_ACCESS_KEY_ID', 'R2_CHAT_ATTACHMENTS_SECRET_ACCESS_KEY'],
      ['R2_HR_DOCUMENTS_BUCKET', 'R2_HR_DOCUMENTS_ACCESS_KEY_ID', 'R2_HR_DOCUMENTS_SECRET_ACCESS_KEY'],
      ['R2_ATTENDANCE_EVIDENCE_BUCKET', 'R2_ATTENDANCE_EVIDENCE_ACCESS_KEY_ID', 'R2_ATTENDANCE_EVIDENCE_SECRET_ACCESS_KEY'],
      ['R2_QUARANTINE_UPLOADS_BUCKET', 'R2_QUARANTINE_UPLOADS_ACCESS_KEY_ID', 'R2_QUARANTINE_UPLOADS_SECRET_ACCESS_KEY'],
    ];
    const missing = purposeSecrets.flatMap((group) =>
      group.filter((key) => !process.env[key]?.trim()),
    );
    if (missing.length) {
      throw new Error(
        `Missing R2 multi-bucket environment variables: ${missing.join(', ')}.`,
      );
    }
  }

  private validateDocumentExtractionEnv() {
    const provider = process.env.DOCUMENT_EXTRACTION_PROVIDER?.trim();
    if (!provider || provider === 'NONE' || provider === 'MANUAL') return;
    if (provider !== 'CLOUDFLARE_WORKERS_AI') {
      throw new Error(
        'Invalid DOCUMENT_EXTRACTION_PROVIDER. Expected NONE, MANUAL, or CLOUDFLARE_WORKERS_AI.',
      );
    }
    const missing = [
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_AI_GATEWAY_ID',
    ].filter((key) => !process.env[key]?.trim());
    if (missing.length) {
      throw new Error(
        `Cloudflare document extraction is enabled but missing: ${missing.join(', ')}.`,
      );
    }
  }

  private requireAny(keys: string[], label: string) {
    if (keys.some((key) => process.env[key]?.trim())) return;
    throw new Error(`${label} is required. Set one of: ${keys.join(', ')}.`);
  }
}
