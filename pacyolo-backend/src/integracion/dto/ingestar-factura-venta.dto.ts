import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModoContabilizacion {
  INMEDIATA = 'INMEDIATA',
  REVISION_PREVIA = 'REVISION_PREVIA',
}

export class ReglaImpuestoEspecificaDto {
  @ApiProperty({
    description: 'Código de la regla tributaria (ej: IVA_19_GENERADO, RETE_SERVICIOS_4.0) o su UUID',
    example: 'IVA_19_GENERADO',
  })
  @IsNotEmpty()
  @IsString()
  regla_id_o_codigo: string;

  @ApiPropertyOptional({
    description: 'Base específica opcional para el cálculo de este impuesto',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  base_especifica?: number;
}

export class IngestarFacturaVentaDto {
  @ApiProperty({
    description: 'ID de la empresa tenant propietaria',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty()
  @IsUUID()
  empresa_id: string;

  @ApiProperty({
    description: 'Sistema emisor que envía la transacción (para idempotencia y trazabilidad)',
    example: 'SHOPIFY_STORE',
  })
  @IsNotEmpty()
  @IsString()
  origen_sistema: string;

  @ApiProperty({
    description: 'ID único de la factura o pedido en el sistema emisor (clave de idempotencia)',
    example: 'ORD-2026-9041',
  })
  @IsNotEmpty()
  @IsString()
  origen_documento_id: string;

  @ApiProperty({
    description: 'Número de factura comercial o fiscal (ej: FAC-1002, SETT-5510)',
    example: 'FAC-1002',
  })
  @IsNotEmpty()
  @IsString()
  numero_factura: string;

  @ApiProperty({
    description: 'ID del tercero / cliente en PACYOLO',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsNotEmpty()
  @IsUUID()
  cliente_id: string;

  @ApiProperty({
    description: 'Código del concepto de venta en el catálogo de mapeo (ej: VENTA_MERCANCIAS, VENTA_SERVICIOS)',
    example: 'VENTA_MERCANCIAS',
  })
  @IsNotEmpty()
  @IsString()
  codigo_concepto: string;

  @ApiProperty({
    description: 'Fecha de emisión de la factura (YYYY-MM-DD)',
    example: '2026-10-17',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha_emision: string;

  @ApiProperty({
    description: 'Fecha límite de pago o vencimiento del crédito (YYYY-MM-DD)',
    example: '2026-11-17',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha_vencimiento: string;

  @ApiProperty({
    description: 'Subtotal antes de impuestos de la factura',
    example: 1000000,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  subtotal: number;

  @ApiPropertyOptional({
    description: 'Reglas de impuestos/retenciones a aplicar (si se omite, usa las configuradas por defecto en la plantilla)',
    type: [ReglaImpuestoEspecificaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaImpuestoEspecificaDto)
  reglas_impuestos?: ReglaImpuestoEspecificaDto[];

  @ApiPropertyOptional({
    description: 'Modo de contabilización: INMEDIATA (genera asiento oficial) o REVISION_PREVIA (queda como borrador pendiente)',
    enum: ModoContabilizacion,
    default: ModoContabilizacion.INMEDIATA,
  })
  @IsOptional()
  @IsEnum(ModoContabilizacion)
  modo_contabilizacion?: ModoContabilizacion;

  @ApiPropertyOptional({
    description: 'Glosa u observaciones de la venta',
    example: 'Venta de productos terminados cliente corporativo',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
