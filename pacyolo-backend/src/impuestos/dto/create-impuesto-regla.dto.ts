import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { TipoImpuesto } from '../entities/impuesto-regla.entity.js';

export class CreateImpuestoReglaDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant) a la que pertenece la regla tributaria' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({
    enum: TipoImpuesto,
    example: TipoImpuesto.RETEFUENTE,
    description: 'Tipo de impuesto o retención: RETEFUENTE, RETEICA, RETEIVA, IVA, AUTORRETENCION',
  })
  @IsEnum(TipoImpuesto)
  @IsNotEmpty()
  tipo_impuesto: TipoImpuesto;

  @ApiProperty({ example: 'RETE_COMPRAS_2.5', description: 'Código único mnemónico de la regla dentro del tenant' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Retención en la Fuente por Compras (Declarantes) 2.5%', description: 'Nombre descriptivo de la regla' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ example: 'Aplica a compras de bienes a personas jurídicas y naturales declarantes', description: 'Descripción o base legal' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 2.5, description: 'Tarifa o porcentaje (ej: 2.5 para 2.5%, 19 para 19%, 0.966 para ReteICA 9.66 por mil)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje: number;

  @ApiPropertyOptional({ example: 1270000, default: 0, description: 'Base mínima en pesos COP a partir de la cual aplica la retención' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  base_minima?: number;

  @ApiProperty({ description: 'ID de la cuenta auxiliar del PUC donde se acredita el valor retenido o causado (ej: 236540 para compras)' })
  @IsUUID()
  @IsNotEmpty()
  cuenta_credito_id: string;

  @ApiPropertyOptional({ description: 'ID de la cuenta auxiliar del PUC donde se debita (ej: 240802 para IVA descontable o 135515 para autorretención)', nullable: true })
  @IsUUID()
  @IsOptional()
  cuenta_debito_id?: string;

  @ApiPropertyOptional({ default: true, description: 'Indica si la regla tributaria está activa' })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
