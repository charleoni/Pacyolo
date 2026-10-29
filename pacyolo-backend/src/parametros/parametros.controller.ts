import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ParametrosService } from './parametros.service.js';
import {
  CreateTipoIdentificacionDto,
  CreateTipoPersonaDto,
  CreateRegimenFiscalDto,
  CreateClasificacionTerceroDto,
  CreateTipoComprobanteConfigDto,
  CreateMetodoPagoDto,
  CreateUnidadMedidaDto,
  CreateCategoriaArticuloDto,
  CreateBodegaDto,
  CreateTipoMovimientoDto,
  UpdateEstadoParametroDto,
  UpdateParametroDto,
} from './dto/parametro.dto.js';

@ApiTags('Tablas Maestras & Parametrización Dinámica')
@Controller('parametros')
export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  @Post('sembrar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sembrar catálogos oficiales DIAN estándar' })
  async sembrar() {
    await this.parametrosService.sembrarSemillasGlobales();
    return { mensaje: 'Catálogos estándar sembrados con éxito.' };
  }

  // 1. TIPOS DE IDENTIFICACIÓN
  @Get('tipos-identificacion')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar tipos de identificación (NIT, CC, CE, etc.)' })
  async listarTiposIdentificacion(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarTiposIdentificacion(empresaId);
  }

  @Post('tipos-identificacion')
  @ApiOperation({ summary: 'Crear nuevo tipo de identificación personalizado' })
  async crearTipoIdentificacion(@Body() dto: CreateTipoIdentificacionDto) {
    return await this.parametrosService.crearTipoIdentificacion(dto);
  }

  // 2. TIPOS DE PERSONA
  @Get('tipos-persona')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar tipos de persona (Natural, Jurídica)' })
  async listarTiposPersona(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarTiposPersona(empresaId);
  }

  @Post('tipos-persona')
  @ApiOperation({ summary: 'Crear nuevo tipo de persona' })
  async crearTipoPersona(@Body() dto: CreateTipoPersonaDto) {
    return await this.parametrosService.crearTipoPersona(dto);
  }

  // 3. REGÍMENES FISCALES
  @Get('regimenes-fiscales')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar regímenes fiscales y responsabilidades tributarias' })
  async listarRegimenesFiscales(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarRegimenesFiscales(empresaId);
  }

  @Post('regimenes-fiscales')
  @ApiOperation({ summary: 'Crear nuevo régimen fiscal' })
  async crearRegimenFiscal(@Body() dto: CreateRegimenFiscalDto) {
    return await this.parametrosService.crearRegimenFiscal(dto);
  }

  // 4. CLASIFICACIONES DE TERCEROS
  @Get('clasificaciones-tercero')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar clasificaciones de terceros (Cliente, Proveedor, etc.)' })
  async listarClasificaciones(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarClasificaciones(empresaId);
  }

  @Post('clasificaciones-tercero')
  @ApiOperation({ summary: 'Crear nueva clasificación de tercero' })
  async crearClasificacion(@Body() dto: CreateClasificacionTerceroDto) {
    return await this.parametrosService.crearClasificacion(dto);
  }

  // 5. TIPOS DE COMPROBANTES
  @Get('tipos-comprobante')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar tipos de comprobantes contables y numeraciones' })
  async listarTiposComprobante(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarTiposComprobante(empresaId);
  }

  @Post('tipos-comprobante')
  @ApiOperation({ summary: 'Crear nuevo tipo de comprobante contable' })
  async crearTipoComprobante(@Body() dto: CreateTipoComprobanteConfigDto) {
    return await this.parametrosService.crearTipoComprobante(dto);
  }

  // 6. MÉTODOS DE PAGO
  @Get('metodos-pago')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar métodos y formas de pago oficiales' })
  async listarMetodosPago(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarMetodosPago(empresaId);
  }

  @Post('metodos-pago')
  @ApiOperation({ summary: 'Crear nuevo método de pago' })
  async crearMetodoPago(@Body() dto: CreateMetodoPagoDto) {
    return await this.parametrosService.crearMetodoPago(dto);
  }

  // 7. DEPARTAMENTOS DANE
  @Get('departamentos')
  @ApiOperation({ summary: 'Listar departamentos oficiales DANE' })
  async listarDepartamentos() {
    return await this.parametrosService.listarDepartamentos();
  }

  // 8. MUNICIPIOS DANE
  @Get('municipios')
  @ApiOperation({ summary: 'Buscar municipios oficiales DANE por nombre o código' })
  async buscarMunicipios(
    @Query('q') query?: string,
    @Query('departamento_codigo') departamentoCodigo?: string,
  ) {
    return await this.parametrosService.buscarMunicipios(query, departamentoCodigo);
  }

  // 9. UNIDADES DE MEDIDA
  @Get('unidades-medida')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar unidades de medida oficiales DIAN/ISO' })
  async listarUnidadesMedida(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarUnidadesMedida(empresaId);
  }

  @Post('unidades-medida')
  @ApiOperation({ summary: 'Crear nueva unidad de medida personalizada' })
  async crearUnidadMedida(@Body() dto: CreateUnidadMedidaDto) {
    return await this.parametrosService.crearUnidadMedida(dto);
  }

  // 10. CATEGORÍAS DE ARTÍCULOS
  @Get('categorias-articulos')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar categorías y familias de artículos con cuentas NIIF' })
  async listarCategoriasArticulos(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarCategoriasArticulos(empresaId);
  }

  @Post('categorias-articulos')
  @ApiOperation({ summary: 'Crear nueva categoría de artículos con mapeo contable' })
  async crearCategoriaArticulo(@Body() dto: CreateCategoriaArticuloDto) {
    return await this.parametrosService.crearCategoriaArticulo(dto);
  }

  // 11. BODEGAS DE ALMACENAMIENTO
  @Get('bodegas')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar bodegas físicas y virtuales de almacenamiento' })
  async listarBodegas(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarBodegas(empresaId);
  }

  @Post('bodegas')
  @ApiOperation({ summary: 'Crear nueva bodega de almacenamiento' })
  async crearBodega(@Body() dto: CreateBodegaDto) {
    return await this.parametrosService.crearBodega(dto);
  }

  // 12. TIPOS DE MOVIMIENTOS DE INVENTARIO
  @Get('tipos-movimiento')
  @ApiHeader({ name: 'x-empresa-id', required: false })
  @ApiOperation({ summary: 'Listar tipos de movimientos de inventario (Entradas, Salidas, Traslados)' })
  async listarTiposMovimiento(@Headers('x-empresa-id') empresaId?: string) {
    return await this.parametrosService.listarTiposMovimiento(empresaId);
  }

  @Post('tipos-movimiento')
  @ApiOperation({ summary: 'Crear nuevo tipo de movimiento de inventario' })
  async crearTipoMovimiento(@Body() dto: CreateTipoMovimientoDto) {
    return await this.parametrosService.crearTipoMovimiento(dto);
  }

  // ACTUALIZACIÓN DE PARÁMETROS MAESTROS
  @Patch(':catalogo/:id')
  @ApiOperation({ summary: 'Actualizar atributos de un registro de tabla maestra' })
  async actualizarParametro(
    @Param('catalogo') catalogo: string,
    @Param('id') id: string,
    @Body() dto: UpdateParametroDto,
  ) {
    return await this.parametrosService.actualizarParametro(catalogo, id, dto);
  }

  // CAMBIO DE ESTADO (ACTIVAR / DESACTIVAR)
  @Patch(':catalogo/:id/estado')
  @ApiOperation({ summary: 'Activar o desactivar un registro de tabla maestra' })
  async cambiarEstado(
    @Param('catalogo') catalogo: string,
    @Param('id') id: string,
    @Body() dto: UpdateEstadoParametroDto,
  ) {
    return await this.parametrosService.cambiarEstado(catalogo, id, dto.activo);
  }
}
