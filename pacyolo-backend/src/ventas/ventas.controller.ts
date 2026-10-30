import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VentasService } from './ventas.service.js';
import { CreateFacturaVentaDto, CreateNotaCreditoDto } from './dto/ventas.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get('notas-credito')
  async listarNotasCredito(@Request() req: any, @Query('search') search?: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.listarNotasCredito(empresaId, search);
  }

  @Get('notas-credito/:id')
  async obtenerNotaCreditoPorId(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.obtenerNotaCreditoPorId(empresaId, id);
  }

  @Post('notas-credito')
  async emitirNotaCredito(@Request() req: any, @Body() dto: CreateNotaCreditoDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.emitirNotaCredito(empresaId, dto, req.user);
  }

  @Get()
  async listar(@Request() req: any, @Query('search') search?: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.listarFacturas(empresaId, search);
  }

  @Get(':id')
  async obtenerPorId(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.obtenerFacturaPorId(empresaId, id);
  }

  @Post()
  async emitir(@Request() req: any, @Body() dto: CreateFacturaVentaDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.emitirFactura(empresaId, dto, req.user);
  }

  @Post(':id/anular')
  async anular(
    @Request() req: any,
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.ventasService.anularFactura(empresaId, id, motivo || 'Anulación por usuario', req.user);
  }
}
