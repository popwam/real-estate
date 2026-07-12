import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvService } from './config/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);
  const localDevOrigins = [
    'http://localhost:3203',
    'http://127.0.0.1:3203',
    'http://localhost:3205',
    'http://127.0.0.1:3205',
  ];
  const allowedOrigins = new Set([...localDevOrigins, ...env.corsOrigins]);
  const allowedSuffixes = env.corsAllowedSuffixes;
  const swaggerConfig = new DocumentBuilder()
    .setTitle('POPWAM API')
    .setDescription('Team 1 backend core API for auth, organizations, users, verification, files, and platform review.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isAllowedSuffixOrigin(origin, allowedSuffixes)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
  });

  SwaggerModule.setup('docs', app, document);

  await app.listen(env.port);
}
bootstrap();

function isAllowedSuffixOrigin(origin: string, suffixes: string[]) {
  let hostname: string;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return false;
    hostname = url.hostname.toLowerCase();
  } catch {
    return false;
  }
  return suffixes.some((suffix) => {
    const normalized = suffix.toLowerCase().replace(/^\./, '');
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
}
