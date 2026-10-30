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
import { PucCuenta } from '../../puc/entities/puc.entity.js';

export enum TipoCuentaBancaria {
  CORRIENTE = 'CORRIENTE',
  AHORROS = 'AHORROS',
}

@Entity({ name: 'teso_cuentas_bancarias', schema: 'contabilidad' })
@Unique(['empresa_id', 'numero_cuenta'])
@Index(['empresa_id', 'numero_cuenta'])
export class CuentaBancaria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 100 })
  banco_nombre: string; // Ej: 'Bancolombia', 'Davivienda', 'Banco de Bogotá'

  @Column({
    type: 'enum',
    enum: TipoCuentaBancaria,
    default: TipoCuentaBancaria.CORRIENTE,
  })
  tipo_cuenta: TipoCuentaBancaria;

  @Column({ type: 'varchar', length: 50 })
  numero_cuenta: string; // Ej: '1023-456789-01'

  @Column({ type: 'uuid' })
  cuenta_puc_id: string;

  @ManyToOne(() => PucCuenta)
  @JoinColumn({ name: 'cuenta_puc_id' })
  cuenta_puc: PucCuenta; // Subcuenta auxiliar NIIF 111005XX

  @Column({ type: 'varchar', length: 10, default: 'COP' })
  moneda: string;

  @Column({ type: 'decimal', precision: 16, scale: 2, default: 0 })
  saldo_libros_actual: number;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
