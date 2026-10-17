import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CausarFacturaCxpDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({ description: 'ID del proveedor (Tercero)' })
  @IsUUID()
  @IsNotEmpty()
  tercero_id: string;

  @ApiProperty({
    example: 'COMPRA_INVENTARIO',
    description: 'Código del concepto operativo en cont_plantillas_mapeo (ej: COMPRA_INVENTARIO, SERVICIOS_ASEO_VIGILANCIA, HONORARIOS_PROFESIONALES)',
  })
  @IsString()
  @IsNotEmpty()
  codigo_concepto: string;

  @ApiProperty({ example: 'FAC-9842', description: 'Número de factura o documento de soporte emitido por el proveedor' })
  @IsString()
  @IsNotEmpty()
  numero_factura_proveedor: string;

  @ApiProperty({ example: '2026-10-17', description: 'Fecha de emisión de la factura (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fecha_emision: string;

  @ApiProperty({ example: '2026-11-17', description: 'Fecha límite de pago acordada con el proveedor (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fecha_vencimiento: string;

  @ApiProperty({ example: 2500000, description: 'Subtotal antes de IVA y retenciones' })
  @IsNumber()
  @Min(0.01)
  subtotal: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['IVA_19_DESCONTABLE', 'RETE_COMPRAS_2.5', 'RETEICA_BOGOTA_9.66'],
    description: 'Sobrescribir reglas de impuestos aplicables. Si se omite, toma las reglas por defecto de la plantilla.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reglas_impuestos_codigos?: string[];

  @ApiPropertyOptional({ example: 'Compra de mercancía para sucursal principal', description: 'Observación o glosa general' })
  @IsString()
  @IsOptional()
  glosa?: string;
}
