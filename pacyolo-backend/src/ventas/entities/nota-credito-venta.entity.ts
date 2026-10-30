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
import { Articulo } from '../../inventarios/entities/articulo.entity.js';
import { Bodega } from '../../parametros/entities/bodega.entity.js';
import { FacturaVenta } from './factura-venta.entity.js';

export enum MotivoNotaCredito {
  DEVOLUCION_TOTAL = 'DEVOLUCION_TOTAL',
  DEVOLUCION_PARCIAL = 'DEVOLUCION_PARCIAL',
  AJUSTE_PRECIO_DESCUENTO = 'AJUSTE_PRECIO_DESCUENTO',
}

export enum TipoReembolsoNotaCredito {
  CARTERA = 'CARTERA',
  DEVOLUCION_DINERO = 'DEVOLUCION_DINERO',
  ANTICIPO_SALDO_FAVOR = 'ANTICIPO_SALDO_FAVOR',
}

@Entity({ name: 'ventas_notas_credito', schema: 'contabilidad' })
@Index(['empresa_id', 'consecutivo'], { unique: true })
@Index(['empresa_id', 'factura_id'])
@Index(['empresa_id', 'cliente_id'])
@Index(['empresa_id', 'fecha_emision'])
export class NotaCreditoVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50 })
  consecutivo: string; // Ej: NC-0001

  @Column({ type: 'uuid' })
  factura_id: string;

  @ManyToOne(() => FacturaVenta)
  @JoinColumn({ name: 'factura_id' })
  factura: FacturaVenta;

  @Column({ type: 'uuid' })
  cliente_id: string;

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Tercero;

  @Column({ type: 'date' })
  fecha_emision: string;

  @Column({
    type: 'enum',
    enum: MotivoNotaCredito,
    default: MotivoNotaCredito.DEVOLUCION_TOTAL,
  })
  motivo_dian: MotivoNotaCredito;

  @Column({
    type: 'enum',
    enum: TipoReembolsoNotaCredito,
    default: TipoReembolsoNotaCredito.CARTERA,
  })
  tipo_reembolso: TipoReembolsoNotaCredito;

  @Column({ type: 'uuid', nullable: true })
  cuenta_reembolso_id: string | null; // Cuenta PUC de caja/banco si fue DEVOLUCION_DINERO

  @Column({ type: 'uuid', nullable: true })
  asiento_id: string | null; // Asiento comercial (reversión de ingreso e IVA vs cartera/caja/anticipo)

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_id' })
  asiento: Asiento | null;

  @Column({ type: 'uuid', nullable: true })
  asiento_costo_id: string | null; // Asiento de reversión de costeo (Débito 14 <-> Crédito 61)

  @ManyToOne(() => Asiento, { nullable: true })
  @JoinColumn({ name: 'asiento_costo_id' })
  asiento_costo: Asiento | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_iva: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_inc: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total_nota: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total_revertido: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  creado_por: string;

  @OneToMany(() => NotaCreditoVentaLinea, (linea) => linea.nota_credito, { cascade: true })
  lineas: NotaCreditoVentaLinea[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

@Entity({ name: 'ventas_notas_credito_lineas', schema: 'contabilidad' })
export class NotaCreditoVentaLinea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  nota_credito_id: string;

  @ManyToOne(() => NotaCreditoVenta, (nc) => nc.lineas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nota_credito_id' })
  nota_credito: NotaCreditoVenta;

  @Column({ type: 'uuid' })
  articulo_id: string;

  @ManyToOne(() => Articulo)
  @JoinColumn({ name: 'articulo_id' })
  articulo: Articulo;

  @Column({ type: 'uuid', nullable: true })
  bodega_id: string | null;

  @ManyToOne(() => Bodega, { nullable: true })
  @JoinColumn({ name: 'bodega_id' })
  bodega: Bodega | null;

  @Column({ type: 'numeric', precision: 12, scale: 4 })
  cantidad: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  precio_unitario: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  tarifa_iva: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  monto_iva: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  tarifa_inc: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  monto_inc: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_unitario: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  costo_total: number;
}
