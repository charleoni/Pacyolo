import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoImpuesto } from '../entities/impuesto-regla.entity.js';

export class FilterImpuestoReglaDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiPropertyOptional({ enum: TipoImpuesto, description: 'Filtrar por tipo de impuesto' })
  @IsEnum(TipoImpuesto)
  @IsOptional()
  tipo_impuesto?: TipoImpuesto;

  @ApiPropertyOptional({ description: 'Filtrar solo reglas activas (true/false)' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activo?: boolean;
}
