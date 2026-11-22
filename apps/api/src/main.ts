import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { PrismaService } from './database/prisma.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use((pinoHttp as any)({
    level: config.get('LOG_LEVEL', 'info'),
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }));

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });
  app.use((request: any, response: any, next: () => void) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      next();
      return;
    }
    const origin = request.headers.origin;
    if (origin) {
      const allowedOrigins = String(config.get('CORS_ORIGIN', 'http://localhost:3000'))
        .split(',')
        .map((value) => value.trim());
      if (!allowedOrigins.includes(origin)) {
        response.status(403).json({
          statusCode: 403,
          message: 'Request origin is not allowed.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
    next();
  });
  app.use(helmet({
    hsts: config.get('NODE_ENV') === 'production',
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('BudgetBook API')
    .setDescription('BudgetBook personal finance platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  const prisma = app.get(PrismaService);
  app.use(async (request: any, response: any, next: () => void) => {
    if (!request.url.startsWith('/api') || request.url.startsWith('/api/admin') ||
        request.url.startsWith('/api/auth') || request.url === '/api/health') {
      next();
      return;
    }
    const setting = await prisma.applicationSetting.findUnique({ where: { key: 'maintenance_mode' } });
    const enabled = setting?.value === true ||
      setting?.value === 'true' ||
      (typeof setting?.value === 'object' && setting.value !== null && 'enabled' in setting.value && (setting.value as any).enabled === true);
    if (enabled) {
      response.status(503).json({
        statusCode: 503,
        message: 'BudgetBook is temporarily under maintenance.',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next();
  });
  await prisma.enableShutdownHooks(app);
  await app.listen(config.get('PORT', 3001));
}
await bootstrap();
