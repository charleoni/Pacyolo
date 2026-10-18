import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConsultaAuditoriaDto {
  @ApiPropertyOptional({ description: 'ID de la empresa para filtrar pistas' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiPropertyOptional({ description: 'Email del usuario que ejecutó la acción' })
  @IsOptional()
  @IsString()
  usuario_email?: string;

  @ApiPropertyOptional({ description: 'Módulo del ERP (ASIENTOS, TERCEROS, PUC, CXP, USUARIOS, etc.)' })
  @IsOptional()
  @IsString()
  modulo?: string;

  @ApiPropertyOptional({ description: 'Acción ejecutada (CREATE, UPDATE, DELETE, LOGIN, ANULAR, etc.)' })
  @IsOptional()
  @IsString()
  accion?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio del rango (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin del rango (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ description: 'Límite de registros por página (máx. 200)', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;

  @ApiPropertyOptional({ description: 'Desplazamiento para paginación', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}
