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
import { TesoreriaService } from './tesoreria.service.js';
import {
  CreateCajaMenorDto,
  CreateGastoCajaMenorDto,
  CreateArqueoCajaMenorDto,
  ReembolsoCajaMenorDto,
  CreateCuentaBancariaDto,
  ImportarExtractoDto,
  EjecutarConciliacionDto,
  CausarNotaBancariaDto,
} from './dto/tesoreria.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('tesoreria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TesoreriaController {
  constructor(private readonly tesoreriaService: TesoreriaService) {}

  // ==========================================
  // CAJAS MENORES
  // ==========================================

  @Post('cajas-menores')
  async crearCajaMenor(@Request() req: any, @Body() dto: CreateCajaMenorDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.crearCajaMenor(empresaId, dto, req.user);
  }

  @Get('cajas-menores')
  async listarCajasMenores(@Request() req: any) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.listarCajasMenores(empresaId);
  }

  @Get('cajas-menores/:id')
  async obtenerCajaMenorPorId(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.obtenerCajaMenorPorId(empresaId, id);
  }

  @Post('cajas-menores/gastos')
  async registrarGasto(@Request() req: any, @Body() dto: CreateGastoCajaMenorDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.registrarGasto(empresaId, dto, req.user);
  }

  @Get('cajas-menores/:id/gastos')
  async listarGastos(
    @Request() req: any,
    @Param('id') id: string,
    @Query('estado') estado?: any,
  ) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.listarGastos(empresaId, id, estado);
  }

  @Post('cajas-menores/reembolsos')
  async reembolsarCajaMenor(@Request() req: any, @Body() dto: ReembolsoCajaMenorDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.reembolsarCajaMenor(empresaId, dto, req.user);
  }

  @Post('cajas-menores/arqueos')
  async registrarArqueo(@Request() req: any, @Body() dto: CreateArqueoCajaMenorDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.registrarArqueo(empresaId, dto, req.user);
  }

  @Get('cajas-menores/:id/arqueos')
  async listarArqueos(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.listarArqueos(empresaId, id);
  }

  // ==========================================
  // CUENTAS BANCARIAS & LIBRO AUXILIAR
  // ==========================================

  @Post('cuentas-bancarias')
  async crearCuentaBancaria(@Request() req: any, @Body() dto: CreateCuentaBancariaDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.crearCuentaBancaria(empresaId, dto, req.user);
  }

  @Get('cuentas-bancarias')
  async listarCuentasBancarias(@Request() req: any) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.listarCuentasBancarias(empresaId);
  }

  @Get('cuentas-bancarias/:id')
  async obtenerCuentaBancariaPorId(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.obtenerCuentaBancariaPorId(empresaId, id);
  }

  @Get('cuentas-bancarias/:id/libro-auxiliar')
  async obtenerLibroAuxiliarBancos(
    @Request() req: any,
    @Param('id') id: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.obtenerLibroAuxiliarBancos(empresaId, id, fechaInicio, fechaFin);
  }

  // ==========================================
  // EXTRACTOS BANCARIOS
  // ==========================================

  @Post('extractos/importar')
  async importarExtracto(@Request() req: any, @Body() dto: ImportarExtractoDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.importarExtracto(empresaId, dto, req.user);
  }

  @Get('extractos')
  async listarExtractos(
    @Request() req: any,
    @Query('cuentaBancariaId') cuentaBancariaId?: string,
  ) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.listarExtractos(empresaId, cuentaBancariaId);
  }

  @Get('extractos/:id')
  async obtenerExtractoPorId(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.obtenerExtractoPorId(empresaId, id);
  }

  // ==========================================
  // CONCILIACIÓN BANCARIA & CAUSACIÓN DE NOTAS
  // ==========================================

  @Post('conciliaciones/ejecutar')
  async ejecutarConciliacion(@Request() req: any, @Body() dto: EjecutarConciliacionDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.ejecutarConciliacion(empresaId, dto, req.user);
  }

  @Get('conciliaciones/:id')
  async obtenerConciliacionPorId(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.obtenerConciliacionPorId(empresaId, id);
  }

  @Post('conciliaciones/:id/aprobar')
  async aprobarConciliacion(@Request() req: any, @Param('id') id: string) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.aprobarConciliacion(empresaId, id, req.user);
  }

  @Post('conciliaciones/causar-nota')
  async causarNotaBancaria(@Request() req: any, @Body() dto: CausarNotaBancariaDto) {
    const empresaId = req.headers['x-empresa-id'] || req.user?.empresa_activa_id;
    return await this.tesoreriaService.causarNotaBancaria(empresaId, dto, req.user);
  }
}
