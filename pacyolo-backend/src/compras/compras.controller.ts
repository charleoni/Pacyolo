import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ComprasService } from './compras.service.js';
import {
  CreateOrdenCompraDto,
  UpdateEstadoOrdenCompraDto,
  CausarOrdenCompraDto,
} from './dto/compras.dto.js';

@ApiTags('Compras')
@ApiBearerAuth()
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get('ordenes')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async listarOrdenes(
    @Headers('x-empresa-id') empresaId?: string,
    @Query('estado') estado?: string,
  ) {
    return await this.comprasService.listarOrdenes(empresaId, estado);
  }

  @Get('ordenes/:id')
  @ApiOperation({ summary: 'Obtener detalle de una orden de compra' })
  async obtenerOrden(@Param('id') id: string) {
    return await this.comprasService.obtenerOrden(id);
  }

  @Post('ordenes')
  @ApiOperation({ summary: 'Crear nueva orden de compra a proveedor' })
  @ApiHeader({ name: 'x-empresa-id', required: false })
  async crearOrden(
    @Body() dto: CreateOrdenCompraDto,
    @Headers('x-empresa-id') empresaId?: string,
  ) {
    return await this.comprasService.crearOrden({
      ...dto,
      empresa_id: dto.empresa_id || empresaId,
    });
  }

  @Patch('ordenes/:id/estado')
  @ApiOperation({ summary: 'Actualizar estado de la orden de compra' })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoOrdenCompraDto,
  ) {
    return await this.comprasService.cambiarEstado(id, dto.estado);
  }

  @Post('ordenes/:id/causar')
  @ApiOperation({ summary: 'Causar formalmente la orden en CxP y generar asiento contable NIIF (CAU)' })
  async causarOrden(
    @Param('id') id: string,
    @Body() dto: CausarOrdenCompraDto,
  ) {
    return await this.comprasService.causarOrden(id, dto);
  }
}
