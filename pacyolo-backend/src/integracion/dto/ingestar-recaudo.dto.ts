import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoRecaudo } from '../../cxc/entities/recaudo-cxc.entity.js';
import { ModoContabilizacion } from './ingestar-factura-venta.dto.js';

export class IngestarRecaudoDto {
  @ApiProperty({
    description: 'ID de la empresa tenant propietaria',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty()
  @IsUUID()
  empresa_id: string;

  @ApiProperty({
    description: 'Sistema emisor que notifica el recaudo (ej: STRIPE, WOMPI, BANCOLOMBIA)',
    example: 'WOMPI_CHECKOUT',
  })
  @IsNotEmpty()
  @IsString()
  origen_sistema: string;

  @ApiProperty({
    description: 'ID de transacción único en la pasarela o banco (clave de idempotencia)',
    example: 'TRX-WOMPI-99014',
  })
  @IsNotEmpty()
  @IsString()
  origen_documento_id: string;

  @ApiPropertyOptional({
    description: 'ID de la Cuenta por Cobrar (CxC) en PACYOLO. Puede usarse en lugar de numero_factura',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsOptional()
  @IsUUID()
  cuenta_por_cobrar_id?: string;

  @ApiPropertyOptional({
    description: 'Número de factura comercial asociada al cobro (si no se envía cuenta_por_cobrar_id)',
    example: 'FAC-VENTA-001',
  })
  @IsOptional()
  @IsString()
  numero_factura?: string;

  @ApiProperty({
    description: 'ID de la cuenta auxiliar de Banco o Caja donde ingresa el dinero (1110xx / 1105xx)',
    example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  })
  @IsNotEmpty()
  @IsUUID()
  cuenta_banco_id: string;

  @ApiProperty({
    description: 'Monto recaudado o cobrado (soporta pagos totales o parciales)',
    example: 1190000,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  monto_recaudo: number;

  @ApiProperty({
    description: 'Fecha en que se hizo efectivo el recaudo (YYYY-MM-DD)',
    example: '2026-10-17',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha_recaudo: string;

  @ApiPropertyOptional({
    description: 'Método de recaudo utilizado',
    enum: MetodoRecaudo,
    default: MetodoRecaudo.TRANSFERENCIA,
  })
  @IsOptional()
  @IsEnum(MetodoRecaudo)
  metodo_recaudo?: MetodoRecaudo;

  @ApiPropertyOptional({
    description: 'Referencia bancaria o código de confirmación del pago',
    example: 'REF-BCO-448102',
  })
  @IsOptional()
  @IsString()
  referencia_transaccion?: string;

  @ApiPropertyOptional({
    description: 'Modo de contabilización: INMEDIATA (genera comprobante ING directo) o REVISION_PREVIA (queda en borrador)',
    enum: ModoContabilizacion,
    default: ModoContabilizacion.INMEDIATA,
  })
  @IsOptional()
  @IsEnum(ModoContabilizacion)
  modo_contabilizacion?: ModoContabilizacion;

  @ApiPropertyOptional({
    description: 'Glosa descriptiva del recaudo',
    example: 'Recaudo pago factura cliente vía pasarela Wompi',
  })
  @IsOptional()
  @IsString()
  glosa?: string;
}
