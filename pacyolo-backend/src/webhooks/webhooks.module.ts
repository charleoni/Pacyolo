import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSuscripcion, WebhookLog } from './entities/webhook.entity.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';
import { WebhooksService } from './webhooks.service.js';
import { WebhooksController } from './webhooks.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookSuscripcion, WebhookLog, Empresa])],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
