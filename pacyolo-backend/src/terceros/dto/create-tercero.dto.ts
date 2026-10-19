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

  @ApiPropertyOptional({ example: 'Bogotá, D.C.' })
  @IsString()
  @IsOptional()
  ciudad_nombre?: string;

  @ApiPropertyOptional({ example: 'CO', default: 'CO' })
  @IsString()
  @IsOptional()
  pais_codigo?: string;

  @ApiPropertyOptional({ example: '11' })
  @IsString()
  @IsOptional()
  departamento_codigo?: string;

  @ApiPropertyOptional({ example: 'Bogotá, D.C.' })
  @IsString()
  @IsOptional()
  departamento_nombre?: string;

  @ApiPropertyOptional({ example: '110111' })
  @IsString()
  @IsOptional()
  codigo_postal?: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsString()
  @IsOptional()
  primer_nombre?: string;

  @ApiPropertyOptional({ example: 'Andrés' })
  @IsString()
  @IsOptional()
  otros_nombres?: string;

  @ApiPropertyOptional({ example: 'Mendoza' })
  @IsString()
  @IsOptional()
  primer_apellido?: string;

  @ApiPropertyOptional({ example: 'Silva' })
  @IsString()
  @IsOptional()
  segundo_apellido?: string;

  @ApiPropertyOptional({ example: 'DISTRIBUIDORA NACIONAL SAS' })
  @IsString()
  @IsOptional()
  razon_social?: string;

  @ApiPropertyOptional({ example: 'NO_RESPONSABLE_IVA', default: 'NO_RESPONSABLE_IVA' })
  @IsString()
  @IsOptional()
  regimen_iva?: string;

  @ApiPropertyOptional({ example: '4711' })
  @IsString()
  @IsOptional()
  actividad_economica_ciiu?: string;

  @ApiPropertyOptional({ example: 'O-13;O-15' })
  @IsString()
  @IsOptional()
  responsabilidades_fiscales?: string;

  @ApiPropertyOptional({ example: 'Bancolombia' })
  @IsString()
  @IsOptional()
  banco_nombre?: string;

  @ApiPropertyOptional({ example: 'AHORROS' })
  @IsString()
  @IsOptional()
  tipo_cuenta_bancaria?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsString()
  @IsOptional()
  numero_cuenta_bancaria?: string;

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
