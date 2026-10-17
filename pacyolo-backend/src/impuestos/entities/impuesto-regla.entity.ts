import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum TipoImpuesto {
  RETEFUENTE = 'RETEFUENTE',
  RETEICA = 'RETEICA',
  RETEIVA = 'RETEIVA',
  IVA = 'IVA',
  AUTORRETENCION = 'AUTORRETENCION',
}

@Entity({ name: 'cont_impuestos_reglas', schema: 'contabilidad' })
@Unique(['empresa_id', 'codigo'])
@Index(['empresa_id', 'tipo_impuesto'])
export class ImpuestoRegla {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'enum', enum: TipoImpuesto })
  tipo_impuesto: TipoImpuesto;

  @Column({ type: 'varchar', length: 50 })
  codigo: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @Column({ type: 'decimal', precision: 7, scale: 4 })
  porcentaje: number; // Ej: 2.5000 para 2.5%, 19.0000 para 19%, 0.9660 para ReteICA 9.66x1000

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  base_minima: number; // En pesos colombianos (COP). Ej: 1270000 para compras declarantes

  @Column({ type: 'uuid' })
  cuenta_credito_id: string;

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_credito_id' })
  cuenta_credito: PucCuenta;

  @Column({ type: 'uuid', nullable: true })
  cuenta_debito_id: string | null;

  @ManyToOne(() => PucCuenta, { nullable: true })
  @JoinColumn({ name: 'cuenta_debito_id' })
  cuenta_debito: PucCuenta | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
