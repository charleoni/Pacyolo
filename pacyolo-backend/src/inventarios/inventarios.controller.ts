import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { InventariosService } from './inventarios.service.js';
import {
  CreateArticuloDto,
  UpdateArticuloDto,
  CreateEntradaAlmacenDto,
  CreateNotaAjusteDto,
  CreateTrasladoDto,
} from './dto/inventarios.dto.js';

@ApiTags('Inventarios')
@ApiBearerAuth()
@Controller('inventarios')
export class InventariosController {
  constructor(private readonly inventariosService: InventariosService) {}

  // ==========================================
  // ARTÍCULOS
  // ==========================================

  @Get('articulos')
  @ApiOperation({ summary: 'Listar catálogo de artículos y servicios' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async listarArticulos(
    @Headers('x-empresa-id') empresaId?: string,
    @Query('tipo') tipo?: string,
    @Query('busqueda') busqueda?: string,
  ) {
    return await this.inventariosService.listarArticulos(empresaId, { tipo, busqueda });
  }

  @Get('articulos/:id')
  @ApiOperation({ summary: 'Obtener detalle de un artículo' })
  async obtenerArticulo(@Param('id') id: string) {
    return await this.inventariosService.obtenerArticulo(id);
  }

  @Post('articulos')
  @ApiOperation({ summary: 'Crear nuevo artículo o servicio (NIC 2)' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async crearArticulo(
    @Body() dto: CreateArticuloDto,
    @Headers('x-empresa-id') empresaId?: string,
  ) {
    return await this.inventariosService.crearArticulo({
      ...dto,
      empresa_id: dto.empresa_id || empresaId,
    });
  }

  @Patch('articulos/:id')
  @ApiOperation({ summary: 'Actualizar datos de un artículo' })
  async actualizarArticulo(@Param('id') id: string, @Body() dto: UpdateArticuloDto) {
    return await this.inventariosService.actualizarArticulo(id, dto);
  }

  @Patch('articulos/:id/estado')
  @ApiOperation({ summary: 'Activar o inactivar un artículo' })
  async cambiarEstadoArticulo(
    @Param('id') id: string,
    @Body('activo') activo: boolean,
  ) {
    return await this.inventariosService.cambiarEstadoArticulo(id, activo);
  }

  // ==========================================
  // ENTRADAS DE ALMACÉN & KARDEX
  // ==========================================

  @Get('entradas')
  @ApiOperation({ summary: 'Listar historial de entradas de almacén' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async listarEntradas(@Headers('x-empresa-id') empresaId?: string) {
    return await this.inventariosService.listarEntradasAlmacen(empresaId);
  }

  @Post('entradas')
  @ApiOperation({ summary: 'Registrar recepción física de mercancía (Entrada de Almacén)' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async registrarEntrada(
    @Body() dto: CreateEntradaAlmacenDto,
    @Headers('x-empresa-id') empresaId?: string,
  ) {
    return await this.inventariosService.registrarEntradaAlmacen({
      ...dto,
      empresa_id: dto.empresa_id || empresaId,
    });
  }

  // ==========================================
  // NOTAS DE AJUSTE
  // ==========================================

  @Get('ajustes')
  @ApiOperation({ summary: 'Listar historial de notas de ajuste de inventario' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async listarAjustes(@Headers('x-empresa-id') empresaId?: string) {
    return await this.inventariosService.listarNotasAjuste(empresaId);
  }

  @Post('ajustes')
  @ApiOperation({ summary: 'Registrar nota de ajuste (sobrante, faltante, merma, cierre)' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async registrarAjuste(
    @Body() dto: CreateNotaAjusteDto,
    @Headers('x-empresa-id') empresaId?: string,
    @Req() req?: any,
  ) {
    const usuarioId = req?.user?.sub || req?.user?.id || dto.usuario_id;
    const creadoPor = req?.user?.email || dto.creado_por;
    return await this.inventariosService.registrarNotaAjuste({
      ...dto,
      empresa_id: dto.empresa_id || empresaId,
      usuario_id: usuarioId,
      creado_por: creadoPor,
    });
  }

  // ==========================================
  // KARDEX & EXISTENCIAS
  // ==========================================

  @Get('kardex')
  @ApiOperation({ summary: 'Consultar movimientos de Kardex continuo NIIF' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async consultarKardex(
    @Headers('x-empresa-id') empresaId?: string,
    @Query('articulo_id') articuloId?: string,
    @Query('bodega_id') bodegaId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return await this.inventariosService.consultarKardex({
      empresaId,
      articuloId,
      bodegaId,
      fechaDesde: desde,
      fechaHasta: hasta,
    });
  }

  @Get('existencias')
  @ApiOperation({ summary: 'Consultar stock y saldos valorados por bodega' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async consultarExistencias(
    @Headers('x-empresa-id') empresaId?: string,
    @Query('bodega_id') bodegaId?: string,
  ) {
    return await this.inventariosService.consultarExistenciasBodega(empresaId, bodegaId);
  }

  // ==========================================
  // TRASLADOS ENTRE BODEGAS
  // ==========================================

  @Get('traslados')
  @ApiOperation({ summary: 'Listar historial de traslados entre bodegas' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async listarTraslados(@Headers('x-empresa-id') empresaId?: string) {
    return await this.inventariosService.listarTraslados(empresaId);
  }

  @Post('traslados')
  @ApiOperation({ summary: 'Registrar traslado de mercancía entre bodegas' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async registrarTraslado(
    @Body() dto: CreateTrasladoDto,
    @Headers('x-empresa-id') empresaId?: string,
  ) {
    return await this.inventariosService.registrarTrasladoBodegas({
      ...dto,
      empresa_id: dto.empresa_id || empresaId,
    });
  }
}
