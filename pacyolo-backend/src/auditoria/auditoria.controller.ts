import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Headers,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service.js';
import { ConsultaAuditoriaDto } from './dto/consulta-auditoria.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolUsuario } from '../usuarios/enums/rol-usuario.enum.js';

@ApiTags('Auditoría Inmutable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Roles(
    RolUsuario.SUPER_ADMIN,
    RolUsuario.ADMIN_EMPRESA,
    RolUsuario.CONTADOR_LIDER,
    RolUsuario.AUDITOR_CONSULTA,
  )
  @ApiOperation({
    summary: 'Consultar pistas de auditoría inmutables del sistema',
    description: 'Permite a administradores, contadores y auditores revisar todas las operaciones realizadas.',
  })
  @ApiHeader({
    name: 'x-empresa-id',
    required: false,
    description: 'UUID de la empresa activa (opcional para Super Admin)',
  })
  @ApiResponse({ status: 200, description: 'Listado de pistas de auditoría paginado' })
  async consultarLogs(
    @Query() queryDto: ConsultaAuditoriaDto,
    @Headers('x-empresa-id') headerEmpresaId: string,
    @Req() req: any,
  ) {
    const esSuperAdmin = req.user?.es_super_admin === true;
    const empresaId = esSuperAdmin ? queryDto.empresa_id || headerEmpresaId || null : headerEmpresaId || null;

    return await this.auditoriaService.consultarLogs(empresaId, queryDto);
  }

  @Get('resumen')
  @Roles(
    RolUsuario.SUPER_ADMIN,
    RolUsuario.ADMIN_EMPRESA,
    RolUsuario.CONTADOR_LIDER,
    RolUsuario.AUDITOR_CONSULTA,
  )
  @ApiOperation({ summary: 'Métricas y resumen de actividad en las últimas 24 horas' })
  async obtenerResumen(
    @Headers('x-empresa-id') headerEmpresaId: string,
    @Req() req: any,
  ) {
    const esSuperAdmin = req.user?.es_super_admin === true;
    const empresaId = esSuperAdmin ? headerEmpresaId || undefined : headerEmpresaId || undefined;
    return await this.auditoriaService.obtenerResumenReciente(empresaId);
  }

  @Get(':id')
  @Roles(
    RolUsuario.SUPER_ADMIN,
    RolUsuario.ADMIN_EMPRESA,
    RolUsuario.CONTADOR_LIDER,
    RolUsuario.AUDITOR_CONSULTA,
  )
  @ApiOperation({ summary: 'Obtener detalle completo de una pista de auditoría' })
  async obtenerDetalle(@Param('id') id: string) {
    const log = await this.auditoriaService.obtenerDetalle(id);
    if (!log) {
      throw new NotFoundException(`Pista de auditoría con ID ${id} no encontrada`);
    }
    return log;
  }
}
