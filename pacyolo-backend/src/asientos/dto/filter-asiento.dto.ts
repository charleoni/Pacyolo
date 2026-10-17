import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TipoComprobante, EstadoAsiento } from '../entities/asiento.entity.js';

export class FilterAsientoDto {
  @ApiProperty({ description: 'ID de la empresa para filtrar los comprobantes' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiPropertyOptional({ enum: TipoComprobante, description: 'Filtrar por tipo de comprobante' })
  @IsEnum(TipoComprobante)
  @IsOptional()
  tipo?: TipoComprobante;

  @ApiPropertyOptional({ enum: EstadoAsiento, description: 'Filtrar por estado' })
  @IsEnum(EstadoAsiento)
  @IsOptional()
  estado?: EstadoAsiento;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Fecha contable inicial (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Fecha contable final (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}
