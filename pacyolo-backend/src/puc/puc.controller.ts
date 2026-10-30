import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PucService } from './puc.service.js';
import { CreatePucCuentaDto } from './dto/create-puc-cuenta.dto.js';
import { PucCuenta } from './entities/puc.entity.js';

@ApiTags('PUC (Plan Único de Cuentas NIIF)')
@Controller('puc')
export class PucController {
  constructor(private readonly pucService: PucService) {}

  @Post('sembrar/:empresa_id')
  @ApiOperation({
    summary: 'Sembrar el catálogo PUC estándar NIIF para una empresa',
    description:
      'Inyecta el árbol oficial de cuentas contables de Colombia NIIF (Activos, Pasivos, Patrimonio, Ingresos, Gastos, Costos) para la empresa indicada.',
  })
  @ApiResponse({ status: 201, description: 'Catálogo sembrado' })
  async sembrarPuc(
    @Param('empresa_id', ParseUUIDPipe) empresaId: string,
  ): Promise<{ total_cuentas: number; mensaje: string }> {
    return await this.pucService.sembrarPucEmpresa(empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una cuenta contable personalizada en el PUC' })
  @ApiResponse({ status: 201, description: 'Cuenta creada exitosamente', type: PucCuenta })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta con ese código' })
  async create(@Body() createPucCuentaDto: CreatePucCuentaDto): Promise<PucCuenta> {
    return await this.pucService.create(createPucCuentaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las cuentas del PUC de una empresa' })
  @ApiQuery({ name: 'empresa_id', required: false })
  @ApiResponse({ status: 200, type: [PucCuenta] })
  async findAll(
    @Request() req: any,
    @Query('empresa_id') queryEmpresaId?: string,
  ): Promise<PucCuenta[]> {
    const empresaId = queryEmpresaId || req.headers?.['x-empresa-id'] || req.user?.empresa_activa_id;
    if (!empresaId) {
      throw new BadRequestException('empresa_id es requerido como query param o header x-empresa-id');
    }
    return await this.pucService.findAll(empresaId);
  }

  @Get('auxiliares')
  @ApiOperation({
    summary: 'Listar únicamente cuentas auxiliares (que permiten movimiento)',
    description: 'Ideal para poblar selectores en creación de asientos o mapeos.',
  })
  @ApiQuery({ name: 'empresa_id', required: false })
  @ApiResponse({ status: 200, type: [PucCuenta] })
  async findAuxiliares(
    @Request() req: any,
    @Query('empresa_id') queryEmpresaId?: string,
  ): Promise<PucCuenta[]> {
    const empresaId = queryEmpresaId || req.headers?.['x-empresa-id'] || req.user?.empresa_activa_id;
    if (!empresaId) {
      throw new BadRequestException('empresa_id es requerido como query param o header x-empresa-id');
    }
    return await this.pucService.findAuxiliares(empresaId);
  }

  @Get('arbol')
  @ApiOperation({
    summary: 'Obtener el catálogo PUC estructurado en árbol jerárquico',
    description: 'Devuelve las clases raíz (1 al 6) con sus ramas de hijos anidados.',
  })
  @ApiQuery({ name: 'empresa_id', required: false })
  @ApiResponse({ status: 200, type: [PucCuenta] })
  async getTree(
    @Request() req: any,
    @Query('empresa_id') queryEmpresaId?: string,
  ): Promise<PucCuenta[]> {
    const empresaId = queryEmpresaId || req.headers?.['x-empresa-id'] || req.user?.empresa_activa_id;
    if (!empresaId) {
      throw new BadRequestException('empresa_id es requerido como query param o header x-empresa-id');
    }
    return await this.pucService.getTree(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una cuenta contable por ID' })
  @ApiResponse({ status: 200, type: PucCuenta })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PucCuenta> {
    return await this.pucService.findOne(id);
  }
}
