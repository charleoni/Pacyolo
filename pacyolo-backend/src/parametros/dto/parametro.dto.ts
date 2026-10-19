import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoIdentificacionDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'NIT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({ example: 'Número de Identificación Tributaria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: '31' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigo_dian?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aplica_digito_verificacion?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateTipoPersonaDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'JURIDICA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @ApiProperty({ example: 'Persona Jurídica' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  exige_razon_social?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateRegimenFiscalDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'RESPONSABLE_IVA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ example: 'Responsable de IVA (Común)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: 'O-13' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo_responsabilidad_dian?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aplica_iva?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateClasificacionTerceroDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'CLIENTE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ example: 'Cliente Comercial' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: '#10b981' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color_badge?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateTipoComprobanteConfigDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'DIA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  codigo: string;

  @ApiProperty({ example: 'Comprobante de Diario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'DIA-' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefijo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  consecutivo_inicial?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateMetodoPagoDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'TRANSFERENCIA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo: string;

  @ApiProperty({ example: 'Transferencia Bancaria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: '47' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigo_dian?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  exige_referencia?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateEstadoParametroDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  activo: boolean;
}

export class UpdateParametroDto {
  @ApiPropertyOptional()
  @IsOptional()
  empresa_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  en_uso?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  conteo_usos?: number;

  @ApiPropertyOptional({ example: 'NIT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiPropertyOptional({ example: 'Número de Identificación Tributaria' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({ example: '31' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo_dian?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  aplica_digito_verificacion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  exige_razon_social?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo_responsabilidad_dian?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  aplica_iva?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color_badge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefijo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  exige_referencia?: boolean;
}
