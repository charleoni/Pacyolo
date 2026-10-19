import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TercerosService } from './terceros.service.js';
import { CreateTerceroDto } from './dto/create-tercero.dto.js';
import { UpdateTerceroDto } from './dto/update-tercero.dto.js';
import { Tercero } from './entities/tercero.entity.js';

@ApiTags('Terceros (Directorio NIIF)')
@Controller('terceros')
export class TercerosController {
  constructor(private readonly tercerosService: TercerosService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un nuevo tercero (Cliente, Proveedor o Empleado)',
    description:
      'Crea un tercero asociado a una empresa específica. Si es tipo NIT, calcula automáticamente el dígito de verificación DIAN si no fue provisto.',
  })
  @ApiResponse({ status: 201, description: 'Tercero creado', type: Tercero })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tercero con ese número de documento en la empresa',
  })
  async create(@Body() createTerceroDto: CreateTerceroDto): Promise<Tercero> {
    return await this.tercerosService.create(createTerceroDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar terceros de una empresa' })
  @ApiQuery({
    name: 'empresa_id',
    required: true,
    description: 'ID de la empresa para filtrar los terceros',
  })
  @ApiResponse({ status: 200, type: [Tercero] })
  async findByEmpresa(
    @Query('empresa_id', ParseUUIDPipe) empresaId: string,
  ): Promise<Tercero[]> {
    return await this.tercerosService.findByEmpresa(empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tercero por ID' })
  @ApiResponse({ status: 200, type: Tercero })
  @ApiResponse({ status: 404, description: 'Tercero no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Tercero> {
    return await this.tercerosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ficha integral de un tercero' })
  @ApiResponse({ status: 200, type: Tercero })
  @ApiResponse({ status: 404, description: 'Tercero no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTerceroDto: UpdateTerceroDto,
  ): Promise<Tercero> {
    return await this.tercerosService.update(id, updateTerceroDto);
  }
}
