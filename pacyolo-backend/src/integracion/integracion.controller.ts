import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { IntegracionService } from './integracion.service.js';
import { IngestarFacturaVentaDto } from './dto/ingestar-factura-venta.dto.js';
import { EstadoBorradorIntegracion } from './entities/borrador-integracion.entity.js';

@ApiTags('Integración Externa (API-First)')
@Controller('integracion')
export class IntegracionController {
  constructor(private readonly integracionService: IntegracionService) {}

  @Post('facturas-venta')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sincronizar e Ingestar Factura de Venta desde sistema externo',
    description:
      'Recibe facturas de venta desde Shopify, facturadores electrónicos o ERPs comerciales. Valida idempotencia con (origen_sistema + origen_documento_id), liquida IVA y retenciones automáticamente y genera el comprobante contable y la CxC (Modo INMEDIATA) o lo coloca en bandeja de revisión (Modo REVISION_PREVIA).',
  })
  @ApiResponse({
    status: 201,
    description: 'Factura procesada exitosamente (contabilizada o en borrador)',
  })
  async ingestarFacturaVenta(@Body() dto: IngestarFacturaVentaDto) {
    return await this.integracionService.ingestarFacturaVenta(dto);
  }

  @Get('borradores/:empresa_id')
  @ApiOperation({
    summary: 'Listar documentos externos en bandeja de borradores / revisión',
    description: 'Permite a contadores o supervisores consultar facturas pendientes de aprobación.',
  })
  @ApiQuery({ name: 'estado', enum: EstadoBorradorIntegracion, required: false })
  async listarBorradores(
    @Param('empresa_id', ParseUUIDPipe) empresa_id: string,
    @Query('estado') estado?: EstadoBorradorIntegracion,
  ) {
    return await this.integracionService.listarBorradores(empresa_id, estado);
  }

  @Post('borradores/:id/aprobar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar borrador de integración y generar comprobante contable oficial',
  })
  async aprobarBorrador(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('revisado_por') revisado_por?: string,
  ) {
    return await this.integracionService.aprobarBorrador(id, revisado_por);
  }

  @Post('borradores/:id/rechazar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar borrador de integración con motivo de rechazo',
  })
  async rechazarBorrador(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
    @Body('revisado_por') revisado_por?: string,
  ) {
    return await this.integracionService.rechazarBorrador(id, motivo, revisado_por);
  }
}
