import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AsientosService } from './asientos.service.js';
import { CreateAsientoDto } from './dto/create-asiento.dto.js';
import { FilterAsientoDto } from './dto/filter-asiento.dto.js';
import { AnularAsientoDto } from './dto/anular-asiento.dto.js';
import { Asiento } from './entities/asiento.entity.js';

@ApiTags('Core Ledger (Asientos Contables)')
@Controller('asientos')
export class AsientosController {
  constructor(private readonly asientosService: AsientosService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar un comprobante contable (Partida Doble)',
    description:
      'Registra un comprobante contable verificando estrictamente que SUM(Débitos) == SUM(Créditos), que las cuentas sean auxiliares y genera el número consecutivo automático oficial.',
  })
  @ApiResponse({
    status: 201,
    description: 'Comprobante registrado exitosamente',
    type: Asiento,
  })
  @ApiResponse({
    status: 400,
    description: 'Descuadre contable, cuentas no auxiliares o falta de tercero obligatorio',
  })
  async create(@Body() createAsientoDto: CreateAsientoDto): Promise<Asiento> {
    return await this.asientosService.create(createAsientoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Consultar el Libro Diario de comprobantes',
    description: 'Permite filtrar por empresa, rango de fechas, tipo de comprobante y estado.',
  })
  @ApiResponse({ status: 200, type: [Asiento] })
  async findAll(@Query() filterDto: FilterAsientoDto): Promise<Asiento[]> {
    return await this.asientosService.findAll(filterDto.empresa_id, {
      tipo: filterDto.tipo,
      estado: filterDto.estado,
      fechaInicio: filterDto.fechaInicio,
      fechaFin: filterDto.fechaFin,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar el detalle completo de un comprobante contable',
    description: 'Devuelve la cabecera del asiento y todas sus líneas de débito/crédito con cuentas y terceros.',
  })
  @ApiResponse({ status: 200, type: Asiento })
  @ApiResponse({ status: 404, description: 'Comprobante no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Asiento> {
    return await this.asientosService.findOne(id);
  }

  @Post(':id/anular')
  @ApiOperation({
    summary: 'Anular un comprobante contable (Reversión NIIF)',
    description:
      'Marca el comprobante como ANULADO y genera automáticamente un asiento de reversión invirtiendo débitos y créditos.',
  })
  @ApiResponse({ status: 200, description: 'Comprobante anulado y reversado', type: Asiento })
  @ApiResponse({ status: 400, description: 'El comprobante ya está anulado' })
  async anular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() anularDto: AnularAsientoDto,
  ): Promise<Asiento> {
    return await this.asientosService.anular(
      id,
      anularDto.motivo,
      anularDto.usuario_id,
    );
  }
}
