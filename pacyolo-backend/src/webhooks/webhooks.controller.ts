import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service.js';
import { CreateWebhookDto } from './dto/create-webhook.dto.js';

@ApiTags('Webhooks & Notificaciones')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Suscribir un nuevo Webhook externo para la empresa tenant',
    description:
      'Registra un endpoint HTTPS receptor de eventos contables con secreto de firma HMAC-SHA256.',
  })
  @ApiResponse({ status: 201, description: 'Suscripción de webhook creada exitosamente' })
  async create(@Body() dto: CreateWebhookDto) {
    return await this.webhooksService.create(dto);
  }

  @Get('empresa/:empresa_id')
  @ApiOperation({
    summary: 'Listar todas las suscripciones de Webhook de una empresa',
  })
  async findAll(@Param('empresa_id', ParseUUIDPipe) empresa_id: string) {
    return await this.webhooksService.findAll(empresa_id);
  }

  @Get('logs/:empresa_id')
  @ApiOperation({
    summary: 'Consultar el historial de entregas de webhooks (Logs de auditoría)',
  })
  @ApiQuery({ name: 'webhook_id', required: false, type: String })
  async findLogs(
    @Param('empresa_id', ParseUUIDPipe) empresa_id: string,
    @Query('webhook_id') webhook_id?: string,
  ) {
    return await this.webhooksService.findLogs(empresa_id, webhook_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una suscripción de Webhook',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.webhooksService.remove(id);
  }
}
