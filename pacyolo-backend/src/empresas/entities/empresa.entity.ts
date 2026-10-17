import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum RegimenTributario {
  SIMPLIFICADO = 'SIMPLIFICADO',
  COMUN = 'COMUN',
  GRAN_CONTRIBUYENTE = 'GRAN_CONTRIBUYENTE',
  AUTORRETENEDOR = 'AUTORRETENEDOR',
  NO_RESPONSABLE_IVA = 'NO_RESPONSABLE_IVA',
}

export enum ModoContabilizacion {
  INMEDIATA = 'INMEDIATA',
  REVISION_PREVIA = 'REVISION_PREVIA',
}

@Entity({ name: 'core_empresas', schema: 'core' })
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  nit: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  dv: string;

  @Column({ type: 'varchar', length: 255 })
  razon_social: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre_comercial: string;

  @Column({
    type: 'enum',
    enum: RegimenTributario,
    default: RegimenTributario.COMUN,
  })
  regimen_tributario: RegimenTributario;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_actividad_ciiu: string;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  moneda: string;

  @Column({
    type: 'enum',
    enum: ModoContabilizacion,
    default: ModoContabilizacion.INMEDIATA,
  })
  modo_contabilizacion_integracion: ModoContabilizacion;

  @Column({ type: 'varchar', length: 128, nullable: true })
  api_key_integracion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  webhook_notificaciones_url: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_municipio: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
