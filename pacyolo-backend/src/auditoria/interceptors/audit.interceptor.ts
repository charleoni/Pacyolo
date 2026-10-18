import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditoriaService } from '../auditoria.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest();
    const res = httpCtx.getResponse();

    const metodo = req.method ? req.method.toUpperCase() : 'UNKNOWN';
    const rutaOriginal = req.originalUrl || req.url || '';

    // Filtrar rutas de swagger, métricas o documentación
    if (
      rutaOriginal.startsWith('/api/docs') ||
      rutaOriginal.includes('favicon.ico') ||
      rutaOriginal === '/api/v1' ||
      rutaOriginal === '/'
    ) {
      return next.handle();
    }

    // Solo interceptamos mutaciones (POST, PUT, PATCH, DELETE) o endpoints críticos de login
    const esMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo);
    if (!esMutacion) {
      return next.handle();
    }

    const inicio = Date.now();
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'UNKNOWN';

    // Resolver módulo a partir de la ruta
    const modulo = this.deducirModulo(rutaOriginal);
    const accion = this.deducirAccion(metodo, rutaOriginal);

    return next.handle().pipe(
      tap((responseBody) => {
        const duracion = Date.now() - inicio;
        const statusCode = res.statusCode || 200;

        const usuario = req.user;
        const usuarioEmail = usuario?.email || req.body?.email || 'ANONIMO';
        const usuarioId = usuario?.sub || usuario?.id || null;
        const empresaId =
          (req.headers['x-empresa-id'] as string) ||
          req.body?.empresa_id ||
          usuario?.empresas?.[0]?.empresa_id ||
          null;

        const entidadId =
          req.params?.id ||
          responseBody?.id ||
          responseBody?.asiento?.id ||
          null;

        // Registrar log asíncronamente
        this.auditoriaService.registrarLog({
          empresa_id: empresaId,
          usuario_id: usuarioId,
          usuario_email: usuarioEmail,
          ip_address: ip,
          user_agent: userAgent,
          metodo_http: metodo,
          ruta: rutaOriginal,
          accion,
          modulo,
          entidad_id: entidadId ? String(entidadId) : null,
          datos_anteriores: null,
          datos_nuevos: req.body || null,
          status_code: statusCode,
          duracion_ms: duracion,
        }).catch((err) => {
          this.logger.error(`Error guardando auditoría: ${err.message}`);
        });
      }),
      catchError((err) => {
        const duracion = Date.now() - inicio;
        const statusCode = err.status || 500;

        const usuario = req.user;
        const usuarioEmail = usuario?.email || req.body?.email || 'ANONIMO';
        const usuarioId = usuario?.sub || usuario?.id || null;
        const empresaId =
          (req.headers['x-empresa-id'] as string) ||
          req.body?.empresa_id ||
          null;

        this.auditoriaService.registrarLog({
          empresa_id: empresaId,
          usuario_id: usuarioId,
          usuario_email: usuarioEmail,
          ip_address: ip,
          user_agent: userAgent,
          metodo_http: metodo,
          ruta: rutaOriginal,
          accion: `${accion}_FALLIDO`,
          modulo,
          entidad_id: req.params?.id || null,
          datos_anteriores: null,
          datos_nuevos: {
            requestBody: req.body,
            error: err.message || 'Error en ejecución',
          },
          status_code: statusCode,
          duracion_ms: duracion,
        }).catch((logErr) => {
          this.logger.error(`Error guardando auditoría de fallo: ${logErr.message}`);
        });

        throw err;
      }),
    );
  }

  private deducirModulo(ruta: string): string {
    const r = ruta.toLowerCase();
    if (r.includes('/auth')) return 'AUTH';
    if (r.includes('/asientos')) return 'ASIENTOS';
    if (r.includes('/puc')) return 'PUC';
    if (r.includes('/terceros')) return 'TERCEROS';
    if (r.includes('/cxp')) return 'CXP';
    if (r.includes('/cxc')) return 'CXC';
    if (r.includes('/usuarios')) return 'USUARIOS';
    if (r.includes('/empresas')) return 'EMPRESAS';
    if (r.includes('/impuestos')) return 'IMPUESTOS';
    if (r.includes('/integracion') || r.includes('/borradores')) return 'INTEGRACION';
    if (r.includes('/webhooks')) return 'WEBHOOKS';
    return 'CORE';
  }

  private deducirAccion(metodo: string, ruta: string): string {
    const r = ruta.toLowerCase();
    if (r.includes('/login')) return 'LOGIN';
    if (r.includes('/anular')) return 'ANULAR';
    if (r.includes('/aprobar')) return 'APROBAR';
    if (r.includes('/rechazar')) return 'RECHAZAR';
    if (r.includes('/reversar')) return 'REVERSAR';

    switch (metodo) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'OPERACION';
    }
  }
}
