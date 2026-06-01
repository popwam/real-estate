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
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...localDevOrigins, ...configuredOrigins]);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('POPWAM API')
    .setDescription('Team 1 backend core API for auth, organizations, users, verification, files, and platform review.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
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
