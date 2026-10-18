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

export enum TipoPersona {
  NATURAL = 'NATURAL',
  JURIDICA = 'JURIDICA',
}

export enum TipoIdentificacion {
  NIT = 'NIT',
  CC = 'CC',
  CE = 'CE',
  PASAPORTE = 'PASAPORTE',
  TI = 'TI',
}

export enum RegimenIva {
  RESPONSABLE = 'RESPONSABLE',
  NO_RESPONSABLE = 'NO_RESPONSABLE',
}

@Entity({ name: 'core_terceros', schema: 'core' })
@Unique(['empresa_id', 'numero_identificacion'])
@Index(['empresa_id', 'numero_identificacion'])
export class Tercero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  empresa_id: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ type: 'varchar', length: 50, default: 'NATURAL' })
  tipo_persona: string;

  @Column({ type: 'varchar', length: 50, default: 'NIT', nullable: true })
  tipo_identificacion: string;

  @Column({ type: 'varchar', length: 30 })
  numero_identificacion: string;

  @Column({ type: 'int', nullable: true })
  digito_verificacion: number;

  @Column({ type: 'varchar', length: 255 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_municipio: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'NO_RESPONSABLE_IVA',
    nullable: true,
  })
  regimen_iva: string;

  @Column({ type: 'boolean', default: false })
  es_gran_contribuyente: boolean;

  @Column({ type: 'boolean', default: false })
  es_autorretenedor: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  actividad_economica_ciiu: string;

  @Column({ type: 'boolean', default: true })
  es_cliente: boolean;

  @Column({ type: 'boolean', default: false })
  es_proveedor: boolean;

  @Column({ type: 'boolean', default: false })
  es_empleado: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
