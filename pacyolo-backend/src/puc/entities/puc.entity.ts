import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity.js';

export enum NaturalezaCuenta {
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
}

export enum ClaseCuenta {
  ACTIVO = 'ACTIVO',
  PASIVO = 'PASIVO',
  PATRIMONIO = 'PATRIMONIO',
  INGRESO = 'INGRESO',
  GASTO = 'GASTO',
  COSTO = 'COSTO',
}

@Entity({ name: 'cont_puc_cuentas', schema: 'contabilidad' })
@Unique(['empresa_id', 'codigo'])
@Index(['empresa_id', 'codigo'])
export class PucCuenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 20 })
  codigo: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'int', default: 1 })
  nivel: number; // 1: Clase, 2: Grupo, 4: Cuenta, 6: Subcuenta, 8+: Auxiliar

  @Column({ type: 'enum', enum: ClaseCuenta })
  clase: ClaseCuenta;

  @Column({ type: 'enum', enum: NaturalezaCuenta })
  naturaleza: NaturalezaCuenta;

  @Column({ type: 'boolean', default: false })
  permite_movimiento: boolean; // true solo para cuentas auxiliares

  @Column({ type: 'boolean', default: false })
  exige_tercero: boolean;

  @Column({ type: 'boolean', default: false })
  exige_centro_costo: boolean;

  @Column({ type: 'boolean', default: false })
  es_cuenta_banco: boolean;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @ManyToOne(() => PucCuenta, (c) => c.children, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id' })
  parent: PucCuenta;

  @OneToMany(() => PucCuenta, (c) => c.parent)
  children: PucCuenta[];

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
