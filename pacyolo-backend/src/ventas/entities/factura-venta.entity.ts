import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { Tercero } from '../../terceros/entities/tercero.entity.js';
import { Asiento } from '../../asientos/entities/asiento.entity.js';
import { FacturaVentaLinea } from './factura-venta-linea.entity.js';

export enum TipoFacturaVenta {
  FACTURA_VENTA = 'FACTURA_VENTA',
  TIQUETE_POS = 'TIQUETE_POS',
}

export enum CondicionPagoVenta {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO',
}

export enum EstadoFacturaVenta {
  EMITIDA = 'EMITIDA',
  ANULADA = 'ANULADA',
}

@Entity({ name: 'ventas_facturas', schema: 'contabilidad' })
@Index(['empresa_id', 'consecutivo'], { unique: true })
@Index(['empresa_id', 'cliente_id'])
@Index(['empresa_id', 'fecha_emision'])
@Index(['empresa_id', 'estado'])
export class FacturaVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50 })
  consecutivo: string; // Ej: FAC-0001, POS-0001

  @Column({
    type: 'enum',
    enum: TipoFacturaVenta,
    default: TipoFacturaVenta.FACTURA_VENTA,
  })
  tipo_documento: TipoFacturaVenta;

  @Column({ type: 'uuid' })
  cliente_id: string;

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Tercero;

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null; // Comprobante contable de la venta (ingreso, impuestos y cartera/caja)

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento | null;

  @Column({ type: 'uuid', nullable: true })
  asiento_costo_id: string | null; // Comprobante contable de costeo automático (Débito 61 <-> Crédito 14)

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_costo_id' })
  asiento_costo: Asiento | null;

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({ type: 'date' })
  fecha_vencimiento: string;

  @Column({
    type: 'enum',
    enum: CondicionPagoVenta,
    default: CondicionPagoVenta.CONTADO,
  })
  condicion_pago: CondicionPagoVenta;

  @Column({ type: 'varchar', length: 50, default: 'EFECTIVO' })
  medio_pago: string; // EFECTIVO, TRANSFERENCIA, TARJETA, CREDITO

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_descuentos: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_iva: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_inc: number; // Impuesto Nacional al Consumo 8%

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  propina: number; // Propina voluntaria para restaurantes y mostrador

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  retefuente: number; // Anticipo retención en la fuente practicada (135515)

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  reteica: number; // Anticipo ReteICA (135518)

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  reteiva: number; // Anticipo ReteIVA (135517)

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total_factura: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total_ventas: number; // Total acumulado de costo promedio ponderado de inventario

  @Column({
    type: 'enum',
    enum: EstadoFacturaVenta,
    default: EstadoFacturaVenta.EMITIDA,
  })
  estado: EstadoFacturaVenta;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  creado_por: string;

  @OneToMany(() => FacturaVentaLinea, (linea) => linea.factura, { cascade: true })
  lineas: FacturaVentaLinea[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
