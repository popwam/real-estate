import { loadEnvironment } from '../src/config/load-environment';

loadEnvironment();

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Set it in the process, apps/api/.env, or the root .env.',
  );
}
if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error('DATABASE_URL must use postgres:// or postgresql://.');
}

export default {
  schema: 'schema.prisma',
  migrations: {
    path: 'migrations',
  },
  datasource: {
    url: databaseUrl,
  },
};
