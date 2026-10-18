import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditoriaLog } from './entities/auditoria-log.entity.js';
import { ConsultaAuditoriaDto } from './dto/consulta-auditoria.dto.js';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(AuditoriaLog)
    private readonly auditRepo: Repository<AuditoriaLog>,
  ) {}

  /**
   * Sanitiza objetos antes de almacenarlos en JSONB para evitar persistir credenciales o tokens.
   */
  private sanitizarPayload(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const copia = JSON.parse(JSON.stringify(data));

    const clavesSensibles = ['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'secret', 'api_key'];

    const limpiar = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (clavesSensibles.includes(key.toLowerCase())) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object') {
          limpiar(obj[key]);
        }
      }
    };

    limpiar(copia);
    return copia;
  }

  /**
   * Registra una pista de auditoría inmutable de manera asíncrona y segura.
   */
  async registrarLog(logData: Partial<AuditoriaLog>): Promise<AuditoriaLog | null> {
    try {
      const nuevoLog = this.auditRepo.create({
        ...logData,
        datos_anteriores: this.sanitizarPayload(logData.datos_anteriores),
        datos_nuevos: this.sanitizarPayload(logData.datos_nuevos),
      });

      return await this.auditRepo.save(nuevoLog);
    } catch (error: any) {
      this.logger.error(`Error persistiendo pista de auditoría: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Consulta pistas de auditoría aplicando filtros de seguridad multi-tenant.
   */
  async consultarLogs(
    empresaIdFiltro: string | null,
    filtros: ConsultaAuditoriaDto,
  ): Promise<{ data: AuditoriaLog[]; total: number; limit: number; offset: number }> {
    const qb = this.auditRepo.createQueryBuilder('log');

    // Restricción por tenant si aplica
    if (empresaIdFiltro) {
      qb.andWhere('(log.empresa_id = :empresaId OR log.empresa_id IS NULL)', {
        empresaId: empresaIdFiltro,
      });
    } else if (filtros.empresa_id) {
      qb.andWhere('log.empresa_id = :empresaId', { empresaId: filtros.empresa_id });
    }

    if (filtros.usuario_email) {
      qb.andWhere('LOWER(log.usuario_email) LIKE LOWER(:email)', {
        email: `%${filtros.usuario_email}%`,
      });
    }

    if (filtros.modulo) {
      qb.andWhere('log.modulo = :modulo', { modulo: filtros.modulo.toUpperCase() });
    }

    if (filtros.accion) {
      qb.andWhere('log.accion = :accion', { accion: filtros.accion.toUpperCase() });
    }

    if (filtros.desde && filtros.hasta) {
      qb.andWhere('log.created_at BETWEEN :desde AND :hasta', {
        desde: new Date(filtros.desde),
        hasta: new Date(filtros.hasta),
      });
    } else if (filtros.desde) {
      qb.andWhere('log.created_at >= :desde', { desde: new Date(filtros.desde) });
    } else if (filtros.hasta) {
      qb.andWhere('log.created_at <= :hasta', { hasta: new Date(filtros.hasta) });
    }

    qb.orderBy('log.created_at', 'DESC')
      .skip(filtros.offset || 0)
      .take(filtros.limit || 50);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      limit: filtros.limit || 50,
      offset: filtros.offset || 0,
    };
  }

  /**
   * Obtiene una pista específica por ID
   */
  async obtenerDetalle(id: string): Promise<AuditoriaLog | null> {
    return await this.auditRepo.findOne({ where: { id } });
  }

  /**
   * Resumen de actividades recientes (para tarjetas de auditoría y métricas del dashboard)
   */
  async obtenerResumenReciente(empresaId?: string): Promise<{ total24h: number; porModulo: Record<string, number> }> {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const qb = this.auditRepo.createQueryBuilder('log')
      .where('log.created_at >= :hace24h', { hace24h });

    if (empresaId) {
      qb.andWhere('(log.empresa_id = :empresaId OR log.empresa_id IS NULL)', { empresaId });
    }

    const logs = await qb.select(['log.modulo']).getMany();
    const porModulo: Record<string, number> = {};
    for (const l of logs) {
      porModulo[l.modulo] = (porModulo[l.modulo] || 0) + 1;
    }

    return {
      total24h: logs.length,
      porModulo,
    };
  }
}
