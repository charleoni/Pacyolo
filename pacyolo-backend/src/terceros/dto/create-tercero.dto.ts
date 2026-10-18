import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
  IsBoolean,
  IsUUID,
} from 'class-validator';
export class CreateTerceroDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant) al que pertenece el tercero' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiPropertyOptional({ example: 'NATURAL', default: 'NATURAL' })
  @IsString()
  @IsOptional()
  tipo_persona?: string;

  @ApiProperty({ example: 'CC' })
  @IsString()
  @IsNotEmpty()
  tipo_identificacion: string;

  @ApiProperty({ example: '1020304050', description: 'Número de documento o NIT sin guiones' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  numero_identificacion: string;

  @ApiPropertyOptional({ example: 4, description: 'Dígito de verificación (se autocalcula si es NIT)' })
  @IsOptional()
  digito_verificacion?: number;

  @ApiProperty({ example: 'Carlos Andrés Mendoza Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre_completo: string;

  @ApiPropertyOptional({ example: 'carlos.mendoza@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Carrera 45 # 120-10' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ example: '11001' })
  @IsString()
  @IsOptional()
  codigo_municipio?: string;

  @ApiPropertyOptional({ example: 'NO_RESPONSABLE_IVA', default: 'NO_RESPONSABLE_IVA' })
  @IsString()
  @IsOptional()
  regimen_iva?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  es_gran_contribuyente?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  es_autorretenedor?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  es_cliente?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  es_proveedor?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  es_empleado?: boolean;
}
