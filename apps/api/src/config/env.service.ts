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

    process.env.NODE_ENV = this.nodeEnv;
    process.env.PORT = String(this.port);
    process.env.DATABASE_URL = this.databaseUrl;
    process.env.JWT_SECRET = this.jwtSecret;
    process.env.JWT_EXPIRES_IN = this.jwtExpiresIn;
    process.env.JWT_REFRESH_SECRET = this.jwtRefreshSecret;
    process.env.JWT_REFRESH_EXPIRES_IN = this.jwtRefreshExpiresIn;
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
}
