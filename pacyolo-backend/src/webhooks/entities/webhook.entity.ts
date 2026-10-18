import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';

export enum EventoWebhook {
  FACTURA_VENTA_CONTABILIZADA = 'factura_venta.contabilizada',
  FACTURA_VENTA_BORRADOR = 'factura_venta.borrador',
  FACTURA_VENTA_APROBADA = 'factura_venta.aprobada',
  FACTURA_VENTA_RECHAZADA = 'factura_venta.rechazada',
  RECAUDO_CONTABILIZADO = 'recaudo.contabilizado',
  RECAUDO_APROBADO = 'recaudo.aprobado',
  RECAUDO_RECHAZADO = 'recaudo.rechazado',
}

@Entity({ name: 'core_webhooks', schema: 'core' })
@Index(['empresa_id', 'activo'])
export class WebhookSuscripcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 150 })
  nombre: string; // Ej: 'Suscripción ERP Comercial / Notificaciones Shopify'

  @Column({ type: 'varchar', length: 500 })
  url_destino: string; // Endpoint HTTPS receptor en el sistema externo

  @Column({ type: 'varchar', length: 100 })
  secreto_firma: string; // Clave para generar HMAC-SHA256 en header X-Pacyolo-Signature

  @Column({ type: 'text', array: true, default: '{}' })
  eventos: string[]; // Lista de eventos a los que se suscribe

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

export enum EstadoEntregaWebhook {
  EXITOSO = 'EXITOSO',
  FALLIDO = 'FALLIDO',
  REINTENTO = 'REINTENTO',
}

@Entity({ name: 'core_webhook_logs', schema: 'core' })
@Index(['empresa_id', 'created_at'])
@Index(['webhook_id', 'estado'])
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @Column({ type: 'uuid' })
  webhook_id: string;

  @ManyToOne(() => WebhookSuscripcion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhook_id' })
  webhook: WebhookSuscripcion;

  @Column({ type: 'varchar', length: 100 })
  evento: string;

  @Column({ type: 'varchar', length: 500 })
  url_destino: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  codigo_respuesta_http: number;

  @Column({ type: 'text', nullable: true })
  cuerpo_respuesta: string;

  @Column({
    type: 'enum',
    enum: EstadoEntregaWebhook,
    default: EstadoEntregaWebhook.EXITOSO,
  })
  estado: EstadoEntregaWebhook;

  @Column({ type: 'int', default: 1 })
  intentos: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firma_enviada: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
