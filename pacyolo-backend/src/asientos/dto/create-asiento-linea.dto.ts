import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateAsientoLineaDto {
  @ApiProperty({ description: 'ID de la cuenta contable auxiliar del PUC' })
  @IsUUID()
  @IsNotEmpty()
  cuenta_id: string;

  @ApiPropertyOptional({ description: 'ID del tercero (obligatorio si la cuenta exige tercero)' })
  @IsUUID()
  @IsOptional()
  tercero_id?: string;

  @ApiPropertyOptional({ description: 'Centro de costo o subproyecto' })
  @IsUUID()
  @IsOptional()
  centro_costo_id?: string;

  @ApiProperty({ example: 500000.0, default: 0, description: 'Valor al Debe' })
  @IsNumber()
  @Min(0)
  debito: number;

  @ApiProperty({ example: 0, default: 0, description: 'Valor al Haber' })
  @IsNumber()
  @Min(0)
  credito: number;

  @ApiPropertyOptional({ example: 0, description: 'Base gravable para impuestos o retenciones' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  base_impuesto?: number;

  @ApiProperty({ example: 'Pago factura proveedor #1024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  glosa_detalle: string;

  @ApiPropertyOptional({ example: 'FE-1024', description: 'Número de factura o documento de soporte' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  documento_referencia?: string;

  @ApiPropertyOptional({ example: '2026-11-15', description: 'Fecha de vencimiento para cartera o proveedores' })
  @IsDateString()
  @IsOptional()
  fecha_vencimiento?: string;
}
