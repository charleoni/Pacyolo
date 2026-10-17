import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service.js';
import { CreateEmpresaDto } from './dto/create-empresa.dto.js';
import { Empresa } from './entities/empresa.entity.js';

@ApiTags('Empresas (Tenants)')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una nueva empresa (Tenant contable)',
    description:
      'Crea una empresa en el sistema, calcula automáticamente su dígito de verificación DIAN y genera su API Key de integración.',
  })
  @ApiResponse({ status: 201, description: 'Empresa creada exitosamente', type: Empresa })
  @ApiResponse({ status: 409, description: 'Ya existe una empresa con ese NIT' })
  async create(@Body() createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    return await this.empresasService.create(createEmpresaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las empresas registradas' })
  @ApiResponse({ status: 200, type: [Empresa] })
  async findAll(): Promise<Empresa[]> {
    return await this.empresasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una empresa por ID' })
  @ApiResponse({ status: 200, type: Empresa })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Empresa> {
    return await this.empresasService.findOne(id);
  }

  @Post(':id/regenerar-api-key')
  @ApiOperation({ summary: 'Regenerar API Key de integración para una empresa' })
  @ApiResponse({ status: 200, description: 'Nueva API Key generada' })
  async regenerarApiKey(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ api_key: string }> {
    return await this.empresasService.regenerarApiKey(id);
  }
}
