import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hushroom API')
    .setDescription('Structured Human Presence Platform — REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & registration')
    .addTag('users', 'User management')
    .addTag('companions', 'Companion profiles & search')
    .addTag('goals', 'Goal management')
    .addTag('contracts', 'Session contracts')
    .addTag('sessions', 'Session lifecycle')
    .addTag('matching', 'Companion matching engine')
    .addTag('payments', 'Payment processing & payouts')
    .addTag('ratings', 'Ratings & reputation')
    .addTag('availability', 'Companion availability')
    .addTag('admin', 'Platform administration')
    .addTag('health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Hushroom API running on port ${port}`);
  console.log(`API docs available at http://localhost:${port}/docs`);
}

bootstrap();
