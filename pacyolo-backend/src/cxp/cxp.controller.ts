import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CxpService } from './cxp.service.js';
import { CausarFacturaCxpDto } from './dto/causar-factura-cxp.dto.js';
import { FilterCxpDto } from './dto/filter-cxp.dto.js';
import { RegistrarPagoCxpDto } from './dto/registrar-pago-cxp.dto.js';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity.js';
import { PagoCxp } from './entities/pago-cxp.entity.js';

@ApiTags('Cuentas por Pagar (CxP)')
@Controller('cxp')
export class CxpController {
  constructor(private readonly cxpService: CxpService) {}

  @Post('causar')
  @ApiOperation({
    summary: 'Causar factura de compra/gasto de un proveedor',
    description: 'Recibe subtotal y concepto operativo, liquida IVA y retenciones en la fuente, genera el asiento contable balanceado (CAU) y registra la cuenta por pagar.',
  })
  @ApiResponse({ status: 201, description: 'Factura causada exitosamente.', type: CuentaPorPagar })
  @ApiResponse({ status: 400, description: 'Datos inválidos o descuadre.' })
  @ApiResponse({ status: 404, description: 'Empresa, proveedor o concepto no encontrado.' })
  causar(@Body() causarDto: CausarFacturaCxpDto): Promise<CuentaPorPagar> {
    return this.cxpService.causarFactura(causarDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar cuentas por pagar de una empresa',
    description: 'Permite consultar las facturas de proveedores filtrando por estado, proveedor y solo vencidas.',
  })
  @ApiResponse({ status: 200, description: 'Listado de cuentas por pagar.', type: [CuentaPorPagar] })
  findAll(@Query() filterDto: FilterCxpDto): Promise<CuentaPorPagar[]> {
    return this.cxpService.findAll(filterDto);
  }

  @Get('cartera/:empresa_id')
  @ApiOperation({
    summary: 'Obtener resumen ejecutivo de cartera de proveedores',
    description: 'Calcula el total de deuda a proveedores, desglose por vencer vs vencida y conteo de facturas abiertas.',
  })
  @ApiParam({ name: 'empresa_id', description: 'UUID de la empresa' })
  @ApiResponse({ status: 200, description: 'Resumen consolidado de cartera.' })
  obtenerCartera(@Param('empresa_id', ParseUUIDPipe) empresa_id: string) {
    return this.cxpService.obtenerResumenCartera(empresa_id);
  }

  @Post('pagar')
  @ApiOperation({
    summary: 'Registrar pago o abono a una factura (Comprobante de Egreso EGR)',
    description: 'Abona o liquida en su totalidad una factura pendiente, generando automáticamente el comprobante de egreso (EGR), cruzando la cuenta por pagar con banco/caja y actualizando el saldo.',
  })
  @ApiResponse({ status: 201, description: 'Pago registrado exitosamente.', type: PagoCxp })
  @ApiResponse({ status: 400, description: 'Monto excede el saldo o cuenta de banco no auxiliar.' })
  @ApiResponse({ status: 404, description: 'Cuenta por pagar no encontrada.' })
  pagar(@Body() pagarDto: RegistrarPagoCxpDto): Promise<PagoCxp> {
    return this.cxpService.registrarPago(pagarDto);
  }

  @Get(':id/pagos')
  @ApiOperation({ summary: 'Listar historial de pagos y egresos de una cuenta por pagar' })
  @ApiParam({ name: 'id', description: 'UUID de la cuenta por pagar' })
  @ApiResponse({ status: 200, description: 'Historial de pagos.', type: [PagoCxp] })
  listarPagos(@Param('id', ParseUUIDPipe) id: string): Promise<PagoCxp[]> {
    return this.cxpService.listarPagos(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de una cuenta por pagar' })
  @ApiParam({ name: 'id', description: 'UUID de la cuenta por pagar' })
  @ApiResponse({ status: 200, description: 'Detalle de la cuenta por pagar.', type: CuentaPorPagar })
  @ApiResponse({ status: 404, description: 'Cuenta por pagar no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CuentaPorPagar> {
    return this.cxpService.findOne(id);
  }
}

