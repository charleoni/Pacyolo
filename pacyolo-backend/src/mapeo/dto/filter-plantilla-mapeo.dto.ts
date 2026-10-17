import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoConceptoMapeo } from '../entities/plantilla-mapeo.entity.js';

export class FilterPlantillaMapeoDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiPropertyOptional({ enum: TipoConceptoMapeo, description: 'Filtrar por tipo de concepto' })
  @IsEnum(TipoConceptoMapeo)
  @IsOptional()
  tipo_concepto?: TipoConceptoMapeo;

  @ApiPropertyOptional({ description: 'Filtrar solo plantillas activas (true/false)' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  activo?: boolean;
}
