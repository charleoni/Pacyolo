import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS habilitado para comunicación con web y clientes externos
  app.enableCors();

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configuración de OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('PACYOLO — API Contable NIIF Universal')
    .setDescription(
      'Documentación técnica e interactiva de endpoints para el Core Ledger Contable y la Interfaz de Integración Externa.',
    )
    .setVersion('1.0.0')
    .addTag('Core Ledger', 'Gestión de comprobantes, asientos de diario y partida doble')
    .addTag('PUC', 'Plan Único de Cuentas NIIF Colombia')
    .addTag('Terceros', 'Directorio de terceros con NIT/RUT')
    .addTag('Integración', 'Endpoints para sistemas externos (PH, POS, E-commerce)')
    .addApiKey(
      { type: 'apiKey', name: 'X-Pacyolo-Api-Key', in: 'header' },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'PACYOLO API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 PACYOLO Backend corriendo en: http://localhost:${port}/api/v1`);
  console.log(`📑 Swagger UI disponible en: http://localhost:${port}/api/docs`);
}

await bootstrap();
