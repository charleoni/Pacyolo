import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  WebhookSuscripcion,
  WebhookLog,
  EstadoEntregaWebhook,
  EventoWebhook,
} from './entities/webhook.entity.js';
import { CreateWebhookDto } from './dto/create-webhook.dto.js';
import { Empresa } from '../empresas/entities/empresa.entity.js';

export interface DespacharEventoOptions {
  empresa_id: string;
  evento: string;
  payload: Record<string, any>;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookSuscripcion)
    private readonly webhookRepo: Repository<WebhookSuscripcion>,
    @InjectRepository(WebhookLog)
    private readonly logRepo: Repository<WebhookLog>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  /**
   * Crear nueva suscripción a Webhook para la empresa tenant
   */
  async create(dto: CreateWebhookDto): Promise<WebhookSuscripcion> {
    const empresa = await this.empresaRepo.findOne({ where: { id: dto.empresa_id } });
    if (!empresa) {
      throw new NotFoundException(`La empresa con ID ${dto.empresa_id} no existe.`);
    }

    const secreto = dto.secreto_firma || `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = this.webhookRepo.create({
      ...dto,
      secreto_firma: secreto,
      activo: dto.activo ?? true,
    });

    return await this.webhookRepo.save(webhook);
  }

  /**
   * Listar suscripciones de Webhook de una empresa
   */
  async findAll(empresa_id: string): Promise<WebhookSuscripcion[]> {
    return await this.webhookRepo.find({
      where: { empresa_id },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Obtener una suscripción por ID
   */
  async findOne(id: string): Promise<WebhookSuscripcion> {
    const webhook = await this.webhookRepo.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException(`La suscripción de Webhook con ID ${id} no existe.`);
    }
    return webhook;
  }

  /**
   * Eliminar una suscripción
   */
  async remove(id: string): Promise<void> {
    const webhook = await this.findOne(id);
    await this.webhookRepo.remove(webhook);
  }

  /**
   * Consultar historial de entregas (Logs) de una empresa o webhook específico
   */
  async findLogs(empresa_id: string, webhook_id?: string): Promise<WebhookLog[]> {
    const where: any = { empresa_id };
    if (webhook_id) {
      where.webhook_id = webhook_id;
    }
    return await this.logRepo.find({
      where,
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  /**
   * Generar firma criptográfica HMAC-SHA256
   */
  calcularFirma(payloadString: string, secreto: string): string {
    return crypto.createHmac('sha256', secreto).update(payloadString).digest('hex');
  }

  /**
   * Despachador asíncrono de eventos:
   * 1. Busca todas las suscripciones activas del tenant suscritas al evento (o a '*').
   * 2. Calcula la firma HMAC-SHA256 con el secreto de cada suscripción.
   * 3. Realiza la entrega HTTP POST con headers estándar:
   *    - Content-Type: application/json
   *    - X-Pacyolo-Event: {evento}
   *    - X-Pacyolo-Signature: sha256={firma}
   * 4. Registra el log de entrega en core_webhook_logs.
   */
  async despacharEvento(opts: DespacharEventoOptions): Promise<WebhookLog[]> {
    const suscripciones = await this.webhookRepo.find({
      where: { empresa_id: opts.empresa_id, activo: true },
    });

    const aplicables = suscripciones.filter(
      (s) => s.eventos.includes(opts.evento) || s.eventos.includes('*'),
    );

    const logs: WebhookLog[] = [];

    for (const sub of aplicables) {
      const payloadConMetadata = {
        evento: opts.evento,
        timestamp: new Date().toISOString(),
        empresa_id: opts.empresa_id,
        datos: opts.payload,
      };

      const payloadString = JSON.stringify(payloadConMetadata);
      const firmaHex = this.calcularFirma(payloadString, sub.secreto_firma);
      const signatureHeader = `sha256=${firmaHex}`;

      let httpStatus = 0;
      let responseBody = '';
      let estadoEntrega = EstadoEntregaWebhook.EXITOSO;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const response = await fetch(sub.url_destino, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Pacyolo-Event': opts.evento,
            'X-Pacyolo-Signature': signatureHeader,
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        httpStatus = response.status;
        responseBody = await response.text();

        if (!response.ok) {
          estadoEntrega = EstadoEntregaWebhook.FALLIDO;
        }
      } catch (err: any) {
        estadoEntrega = EstadoEntregaWebhook.FALLIDO;
        responseBody = err.message || 'Error de conexión HTTP';
      }

      const log = this.logRepo.create({
        empresa_id: opts.empresa_id,
        webhook_id: sub.id,
        evento: opts.evento,
        url_destino: sub.url_destino,
        payload: payloadConMetadata,
        codigo_respuesta_http: httpStatus || 0,
        cuerpo_respuesta: responseBody.slice(0, 2000), // Limitar longitud
        estado: estadoEntrega,
        intentos: 1,
        firma_enviada: signatureHeader,
      });

      const guardado = await this.logRepo.save(log);
      logs.push(guardado);
    }

    return logs;
  }
}
