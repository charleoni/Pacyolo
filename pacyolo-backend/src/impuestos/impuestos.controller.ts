import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ImpuestosService } from './impuestos.service.js';
import { CreateImpuestoReglaDto } from './dto/create-impuesto-regla.dto.js';
import { UpdateImpuestoReglaDto } from './dto/update-impuesto-regla.dto.js';
import { FilterImpuestoReglaDto } from './dto/filter-impuesto-regla.dto.js';
import { CalcularImpuestosDto } from './dto/calcular-impuestos.dto.js';
import { CalculoImpuestosResultadoDto } from './dto/calculo-impuestos-resultado.dto.js';
import { ImpuestoRegla } from './entities/impuesto-regla.entity.js';

@ApiTags('Impuestos y Retenciones')
@Controller('impuestos')
export class ImpuestosController {
  constructor(private readonly impuestosService: ImpuestosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una regla tributaria personalizada',
    description: 'Registra una regla de Retefuente, ReteICA, ReteIVA o IVA vinculada a cuentas auxiliares del PUC.',
  })
  @ApiResponse({ status: 201, description: 'Regla creada exitosamente.', type: ImpuestoRegla })
  @ApiResponse({ status: 400, description: 'Cuentas no son auxiliares o no pertenecen a la empresa.' })
  @ApiResponse({ status: 409, description: 'Código de regla ya existe para esta empresa.' })
  create(@Body() createDto: CreateImpuestoReglaDto): Promise<ImpuestoRegla> {
    return this.impuestosService.create(createDto);
  }

  @Post('calcular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Motor de cálculo tributario: liquidar retenciones e IVA',
    description: 'Evalúa el subtotal contra las bases mínimas legales de las reglas solicitadas, calcula IVA y retenciones practicadas, y devuelve el neto financiero junto con las líneas contables sugeridas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liquidación tributaria calculada con éxito.',
    type: CalculoImpuestosResultadoDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa o reglas de impuesto no encontradas.' })
  calcular(@Body() calcularDto: CalcularImpuestosDto): Promise<CalculoImpuestosResultadoDto> {
    return this.impuestosService.calcularImpuestos(calcularDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar reglas tributarias de una empresa',
    description: 'Devuelve las reglas de impuestos y retenciones filtradas por empresa, tipo y estado activo.',
  })
  @ApiResponse({ status: 200, description: 'Listado de reglas tributarias.', type: [ImpuestoRegla] })
  findAll(@Query() filterDto: FilterImpuestoReglaDto): Promise<ImpuestoRegla[]> {
    return this.impuestosService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una regla tributaria por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la regla' })
  @ApiResponse({ status: 200, description: 'Detalle de la regla tributaria.', type: ImpuestoRegla })
  @ApiResponse({ status: 404, description: 'Regla no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ImpuestoRegla> {
    return this.impuestosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una regla tributaria' })
  @ApiParam({ name: 'id', description: 'UUID de la regla' })
  @ApiResponse({ status: 200, description: 'Regla actualizada exitosamente.', type: ImpuestoRegla })
  @ApiResponse({ status: 404, description: 'Regla no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateImpuestoReglaDto,
  ): Promise<ImpuestoRegla> {
    return this.impuestosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una regla tributaria' })
  @ApiParam({ name: 'id', description: 'UUID de la regla' })
  @ApiResponse({ status: 204, description: 'Regla eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Regla no encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.impuestosService.remove(id);
  }

  @Post('sembrar/:empresa_id')
  @ApiOperation({
    summary: 'Sembrar catálogo estándar de retenciones e impuestos colombianos',
    description: 'Configura automáticamente las tarifas universales (Retefuente compras 2.5%, servicios 4.0%, honorarios 10.0%, ReteICA 9.66x1000, IVA 19% compras y ventas) vinculadas al PUC de la empresa.',
  })
  @ApiParam({ name: 'empresa_id', description: 'UUID de la empresa' })
  @ApiResponse({ status: 201, description: 'Reglas estándar creadas exitosamente.', type: [ImpuestoRegla] })
  sembrar(@Param('empresa_id', ParseUUIDPipe) empresa_id: string): Promise<ImpuestoRegla[]> {
    return this.impuestosService.sembrarReglasEstandar(empresa_id);
  }
}
