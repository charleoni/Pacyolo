import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoCuentaPorPagar } from '../entities/cuenta-por-pagar.entity.js';

export class FilterCxpDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiPropertyOptional({ description: 'Filtrar por proveedor específico' })
  @IsUUID()
  @IsOptional()
  tercero_id?: string;

  @ApiPropertyOptional({
    enum: EstadoCuentaPorPagar,
    description: 'Filtrar por estado: PENDIENTE, PAGADA_PARCIAL, PAGADA_TOTAL, ANULADA',
  })
  @IsEnum(EstadoCuentaPorPagar)
  @IsOptional()
  estado?: EstadoCuentaPorPagar;

  @ApiPropertyOptional({ description: 'Filtrar solo facturas vencidas a la fecha actual' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  vencidas_solo?: boolean;
}
