import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no especifica decorador @Roles, no restringe por rol
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado en el contexto de seguridad');
    }

    // Los super administradores tienen acceso global omnipotente
    if (user.es_super_admin) {
      return true;
    }

    // Identificar el tenant objetivo (desde header 'x-empresa-id', query param, o route param)
    const empresaId =
      request.headers['x-empresa-id'] ||
      request.params?.empresa_id ||
      request.params?.id || // En rutas de empresa
      request.query?.empresa_id ||
      request.body?.empresa_id;

    if (!empresaId) {
      // Si la ruta requiere roles pero no se especifica tenant, verificar si posee el rol en alguna de sus empresas
      const tieneRolEnAlguna = user.empresas?.some((e) => requiredRoles.includes(e.rol));
      if (!tieneRolEnAlguna) {
        throw new ForbiddenException(
          `Acceso denegado: Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
        );
      }
      return true;
    }

    // Multi-tenant estricto: validar pertenencia y rol específico para este tenant
    const membresiaEmpresa = user.empresas?.find(
      (e) => e.empresa_id.toLowerCase() === String(empresaId).toLowerCase(),
    );

    if (!membresiaEmpresa) {
      throw new ForbiddenException(
        `Acceso denegado: El usuario no pertenece a la empresa solicitada (${empresaId}).`,
      );
    }

    const tienePermiso = requiredRoles.includes(membresiaEmpresa.rol);
    if (!tienePermiso) {
      throw new ForbiddenException(
        `Acceso denegado: Su rol (${membresiaEmpresa.rol}) no tiene privilegios suficientes en esta empresa. Roles requeridos: ${requiredRoles.join(', ')}.`,
      );
    }

    return true;
  }
}
