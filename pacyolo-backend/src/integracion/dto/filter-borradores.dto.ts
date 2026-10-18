import { IsUUID, IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  EstadoBorradorIntegracion,
  TipoBorradorIntegracion,
} from '../entities/borrador-integracion.entity.js';

export class FilterBorradoresDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado del borrador',
    enum: EstadoBorradorIntegracion,
  })
  @IsOptional()
  @IsEnum(EstadoBorradorIntegracion)
  estado?: EstadoBorradorIntegracion;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de documento',
    enum: TipoBorradorIntegracion,
  })
  @IsOptional()
  @IsEnum(TipoBorradorIntegracion)
  tipo_documento?: TipoBorradorIntegracion;

  @ApiPropertyOptional({
    description: 'Filtrar por sistema origen (ej: SHOPIFY, WOMPI, DIAN)',
  })
  @IsOptional()
  @IsString()
  origen_sistema?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial de recepción (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha final de recepción (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
}
