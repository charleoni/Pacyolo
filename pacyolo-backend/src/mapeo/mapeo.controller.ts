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
import { MapeoService } from './mapeo.service.js';
import { CreatePlantillaMapeoDto } from './dto/create-plantilla-mapeo.dto.js';
import { UpdatePlantillaMapeoDto } from './dto/update-plantilla-mapeo.dto.js';
import { FilterPlantillaMapeoDto } from './dto/filter-plantilla-mapeo.dto.js';
import { PlantillaMapeo } from './entities/plantilla-mapeo.entity.js';

@ApiTags('Mapeo de Conceptos Contables')
@Controller('mapeo-conceptos')
export class MapeoController {
  constructor(private readonly mapeoService: MapeoService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una plantilla de mapeo conceptual',
    description: 'Registra un mapeo que traduce un evento o concepto operativo (ej: COMPRA_INVENTARIO) a cuentas contables débito y crédito del PUC.',
  })
  @ApiResponse({ status: 201, description: 'Plantilla de mapeo creada con éxito.', type: PlantillaMapeo })
  @ApiResponse({ status: 400, description: 'Cuentas no son auxiliares o no pertenecen a la empresa.' })
  @ApiResponse({ status: 409, description: 'Código de concepto ya existe para esta empresa.' })
  create(@Body() createDto: CreatePlantillaMapeoDto): Promise<PlantillaMapeo> {
    return this.mapeoService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar plantillas de mapeo de una empresa',
    description: 'Devuelve todas las plantillas configuradas para la empresa, con filtros opcionales por tipo y estado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de plantillas de mapeo.', type: [PlantillaMapeo] })
  findAll(@Query() filterDto: FilterPlantillaMapeoDto): Promise<PlantillaMapeo[]> {
    return this.mapeoService.findAll(filterDto);
  }

  @Get('codigo/:empresa_id/:codigo_concepto')
  @ApiOperation({
    summary: 'Buscar plantilla por código de concepto operativo',
    description: 'Permite a los módulos de causación (CxP) o integraciones externas consultar el mapeo contable pasando el código mnemónico.',
  })
  @ApiParam({ name: 'empresa_id', description: 'UUID de la empresa' })
  @ApiParam({ name: 'codigo_concepto', description: 'Código del concepto (ej: COMPRA_INVENTARIO)' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada.', type: PlantillaMapeo })
  @ApiResponse({ status: 404, description: 'Concepto no configurado para esta empresa.' })
  findByCodigo(
    @Param('empresa_id', ParseUUIDPipe) empresa_id: string,
    @Param('codigo_concepto') codigo_concepto: string,
  ): Promise<PlantillaMapeo> {
    return this.mapeoService.findByCodigo(empresa_id, codigo_concepto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una plantilla de mapeo por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Detalle de la plantilla.', type: PlantillaMapeo })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PlantillaMapeo> {
    return this.mapeoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una plantilla de mapeo' })
  @ApiParam({ name: 'id', description: 'UUID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada exitosamente.', type: PlantillaMapeo })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePlantillaMapeoDto,
  ): Promise<PlantillaMapeo> {
    return this.mapeoService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una plantilla de mapeo' })
  @ApiParam({ name: 'id', description: 'UUID de la plantilla' })
  @ApiResponse({ status: 204, description: 'Plantilla eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.mapeoService.remove(id);
  }

  @Post('sembrar/:empresa_id')
  @ApiOperation({
    summary: 'Sembrar catálogo estándar de plantillas de mapeo',
    description: 'Genera automáticamente las plantillas operacionales clave (Inventarios, Honorarios, Servicios de Aseo/Vigilancia, Servicios Públicos, Mantenimientos y Gastos Diversos) enlazadas al PUC de la empresa.',
  })
  @ApiParam({ name: 'empresa_id', description: 'UUID de la empresa' })
  @ApiResponse({ status: 201, description: 'Plantillas estándar creadas exitosamente.', type: [PlantillaMapeo] })
  sembrar(@Param('empresa_id', ParseUUIDPipe) empresa_id: string): Promise<PlantillaMapeo[]> {
    return this.mapeoService.sembrarPlantillasEstandar(empresa_id);
  }
}
