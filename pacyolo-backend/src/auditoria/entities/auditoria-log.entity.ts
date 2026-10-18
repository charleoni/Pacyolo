import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'core_audit_logs', schema: 'core' })
@Index(['empresa_id', 'created_at'])
@Index(['modulo', 'created_at'])
@Index(['usuario_id', 'created_at'])
export class AuditoriaLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  empresa_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string | null;

  @Column({ type: 'varchar', length: 255, default: 'ANONIMO' })
  usuario_email: string;

  @Column({ type: 'varchar', length: 64, default: 'UNKNOWN' })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 10 })
  metodo_http: string;

  @Column({ type: 'text' })
  ruta: string;

  @Column({ type: 'varchar', length: 50 })
  accion: string; // 'CREATE', 'UPDATE', 'DELETE', 'ANULAR', 'LOGIN', 'LOGIN_FAILED', 'REVERSAR', etc.

  @Column({ type: 'varchar', length: 50 })
  modulo: string; // 'ASIENTOS', 'PUC', 'TERCEROS', 'CXP', 'USUARIOS', 'AUTH', 'EMPRESAS', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  entidad_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  datos_anteriores: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  datos_nuevos: Record<string, any> | null;

  @Column({ type: 'int', nullable: true })
  status_code: number | null;

  @Column({ type: 'int', nullable: true })
  duracion_ms: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
