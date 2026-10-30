import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CxcService } from './cxc.service.js';
import { RegistrarRecaudoDto } from './dto/cxc.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('cxc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CxcController {
  constructor(private readonly cxcService: CxcService) {}

  @Get()
  async listarCartera(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('estado') estado?: string,
  ) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.cxcService.listarCartera(empresaId, search, estado);
  }

  @Post('recaudos')
  async registrarRecaudo(@Request() req: any, @Body() dto: RegistrarRecaudoDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.cxcService.registrarRecaudo(empresaId, dto, req.user);
  }

  @Get('recaudos/:cxcId')
  async listarRecaudosPorFactura(@Request() req: any, @Param('cxcId') cxcId: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.cxcService.listarRecaudosPorFactura(empresaId, cxcId);
  }

  @Delete('recaudos/:id')
  async anularRecaudo(
    @Request() req: any,
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    await this.cxcService.anularRecaudo(empresaId, id, motivo || 'Anulación por usuario', req.user);
    return { success: true, message: 'Recaudo anulado exitosamente.' };
  }

  @Get('reportes/estado-cuenta/:clienteId')
  async obtenerEstadoCuenta(@Request() req: any, @Param('clienteId') clienteId: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.cxcService.obtenerEstadoCuentaCliente(empresaId, clienteId);
  }

  @Get('reportes/extracto/:clienteId')
  async obtenerExtracto(@Request() req: any, @Param('clienteId') clienteId: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.cxcService.obtenerExtractoCliente(empresaId, clienteId);
  }

  @Get('reportes/matriz-edades')
  async obtenerMatrizEdades(@Request() req: any) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.cxcService.obtenerMatrizEdadesCartera(empresaId);
  }
}
