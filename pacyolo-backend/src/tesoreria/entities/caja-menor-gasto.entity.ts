import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { CajaMenor } from './caja-menor.entity.js';
import { Tercero } from '../../terceros/entities/tercero.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum EstadoGastoCajaMenor {
  LEGALIZADO = 'LEGALIZADO',
  REEMBOLSADO = 'REEMBOLSADO',
  ANULADO = 'ANULADO',
}

@Entity({ name: 'teso_cajas_menores_gastos', schema: 'contabilidad' })
@Unique(['empresa_id', 'caja_menor_id', 'consecutivo'])
@Index(['empresa_id', 'caja_menor_id'])
export class CajaMenorGasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'uuid' })
  caja_menor_id: string;

  @ManyToOne(() => CajaMenor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caja_menor_id' })
  caja_menor: CajaMenor;

  @Column({ type: 'varchar', length: 50 })
  consecutivo: string; // Ej: 'VCM-0001'

  @Column({ type: 'date' })
  fecha_gasto: Date;

  @Column({ type: 'uuid' })
  tercero_id: string;

  @ManyToOne(() => Tercero)
  @JoinColumn({ name: 'tercero_id' })
  tercero: Tercero; // Proveedor del gasto menor

  @Column({ type: 'varchar', length: 255 })
  concepto: string; // Ej: 'Compra papelería de urgencia'

  @Column({ type: 'uuid' })
  cuenta_gasto_id: string;

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_gasto_id' })
  cuenta_gasto: PucCuenta; // Cuenta 51/52 (Gasto operacional)

  @Column({ type: 'uuid', nullable: true })
  centro_costo_id?: string | null;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  iva: number;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  retefuente: number;

  @Column({ type: 'decimal', precision: 16, scale: 2 })
  total: number; // Monto desembolsado en efectivo de la caja menor

  @Column({ type: 'varchar', length: 100, nullable: true })
  soporte_factura_ref?: string | null; // Ej: 'Factura Electrónica FE-1025' o 'Tiquete POS'

  @Column({ type: 'uuid', nullable: true })
  asiento_id?: string | null; // Asiento contable de causación directa si aplica

  @Column({ type: 'uuid', nullable: true })
  reembolso_asiento_id?: string | null; // Vinculado al Egreso de reposición de caja

  @Column({
    type: 'enum',
    enum: EstadoGastoCajaMenor,
    default: EstadoGastoCajaMenor.LEGALIZADO,
  })
  estado: EstadoGastoCajaMenor;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
