import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import {
  NaturalezaCuenta,
  ClaseCuenta,
} from '../entities/puc.entity.js';

export class CreatePucCuentaDto {
  @ApiProperty({ description: 'ID de la empresa al que pertenece la cuenta' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({ example: '11100503', description: 'Código contable único de la cuenta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({ example: 'Banco Davivienda Cta Ahorros', description: 'Nombre descriptivo de la cuenta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ example: 8, description: 'Nivel: 1 (Clase), 2 (Grupo), 4 (Cuenta), 6 (Subcuenta), 8 (Auxiliar)' })
  @IsInt()
  @Min(1)
  nivel: number;

  @ApiProperty({ enum: ClaseCuenta, example: ClaseCuenta.ACTIVO })
  @IsEnum(ClaseCuenta)
  @IsNotEmpty()
  clase: ClaseCuenta;

  @ApiProperty({ enum: NaturalezaCuenta, example: NaturalezaCuenta.DEBITO })
  @IsEnum(NaturalezaCuenta)
  @IsNotEmpty()
  naturaleza: NaturalezaCuenta;

  @ApiPropertyOptional({ default: true, description: 'true solo si permite asentar movimientos contables (último nivel)' })
  @IsBoolean()
  @IsOptional()
  permite_movimiento?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Obliga a asociar un tercero en el asiento' })
  @IsBoolean()
  @IsOptional()
  exige_tercero?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  exige_centro_costo?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Indica si es cuenta de caja o banco sujeta a conciliación' })
  @IsBoolean()
  @IsOptional()
  es_cuenta_banco?: boolean;

  @ApiPropertyOptional({ description: 'ID de la cuenta padre en el árbol jerárquico' })
  @IsUUID()
  @IsOptional()
  parent_id?: string;
}
