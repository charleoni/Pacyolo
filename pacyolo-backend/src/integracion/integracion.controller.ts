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
import { IngestarRecaudoDto } from './dto/ingestar-recaudo.dto.js';
import { FilterBorradoresDto } from './dto/filter-borradores.dto.js';
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

  @Post('recaudos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sincronizar e Ingestar Recaudo / Cobro de Factura desde pasarelas o bancos',
    description:
      'Registra pagos de clientes recibidos vía pasarelas (Wompi, Stripe, PayU) o extractos bancarios. Valida idempotencia, abona a tesorería (1110/1105), cancela saldo de cartera CxC y genera comprobante de ingreso ING.',
  })
  @ApiResponse({
    status: 201,
    description: 'Recaudo procesado exitosamente (contabilizado o en borrador)',
  })
  async ingestarRecaudo(@Body() dto: IngestarRecaudoDto) {
    return await this.integracionService.ingestarRecaudo(dto);
  }

  @Get('cxc/:cxc_id/recaudos')
  @ApiOperation({
    summary: 'Consultar historial de recaudos / cobros de una factura de venta',
  })
  async obtenerRecaudosPorCxc(@Param('cxc_id', ParseUUIDPipe) cxc_id: string) {
    return await this.integracionService.obtenerRecaudosPorCxc(cxc_id);
  }

  @Get('borradores/:empresa_id')
  @ApiOperation({
    summary: 'Listar documentos externos en bandeja de borradores / revisión',
    description: 'Permite a contadores o supervisores consultar facturas y recaudos pendientes de aprobación con filtros avanzados.',
  })
  async listarBorradores(
    @Param('empresa_id', ParseUUIDPipe) empresa_id: string,
    @Query() filter: FilterBorradoresDto,
  ) {
    return await this.integracionService.listarBorradores(empresa_id, filter);
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
