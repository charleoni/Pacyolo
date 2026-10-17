import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoComprobante, EstadoAsiento } from '../entities/asiento.entity.js';
import { CreateAsientoLineaDto } from './create-asiento-linea.dto.js';

export class CreateAsientoDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant) al que pertenece el comprobante' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({
    enum: TipoComprobante,
    example: TipoComprobante.DIA,
    description: 'Tipo de comprobante: ING (Ingreso), EGR (Egreso), DIA (Diario), CAU (Causación), AJU (Ajuste), APE (Apertura)',
  })
  @IsEnum(TipoComprobante)
  @IsNotEmpty()
  tipo_comprobante: TipoComprobante;

  @ApiProperty({ example: '2026-10-17', description: 'Fecha contable del hecho económico (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fecha_contable: string;

  @ApiProperty({ example: 'Causación de servicios públicos del mes', description: 'Descripción o concepto general' })
  @IsString()
  @IsNotEmpty()
  glosa_general: string;

  @ApiPropertyOptional({
    enum: EstadoAsiento,
    default: EstadoAsiento.CONTABILIZADO,
    description: 'CONTABILIZADO por defecto. Si es integración con revisión previa, usar REVISION_INTEGRACION.',
  })
  @IsEnum(EstadoAsiento)
  @IsOptional()
  estado?: EstadoAsiento;

  @ApiPropertyOptional({ example: 'MANUAL', description: 'Identificador del sistema de origen' })
  @IsString()
  @IsOptional()
  origen_sistema?: string;

  @ApiPropertyOptional({ example: 'FACTURA_COMPRA' })
  @IsString()
  @IsOptional()
  origen_documento_tipo?: string;

  @ApiPropertyOptional({ example: 'DOC-EXT-9921', description: 'ID de la transacción en el sistema externo para idempotencia' })
  @IsString()
  @IsOptional()
  origen_documento_id?: string;

  @ApiPropertyOptional({ description: 'ID del usuario que crea el comprobante' })
  @IsUUID()
  @IsOptional()
  created_by?: string;

  @ApiProperty({
    type: [CreateAsientoLineaDto],
    description: 'Líneas de débito y crédito que componen el comprobante (Partida Doble)',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'El comprobante debe tener al menos 2 líneas para cumplir la partida doble' })
  @ValidateNested({ each: true })
  @Type(() => CreateAsientoLineaDto)
  lineas: CreateAsientoLineaDto[];
}
