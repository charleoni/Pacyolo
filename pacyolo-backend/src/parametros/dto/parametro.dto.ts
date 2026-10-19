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

export class CreateUnidadMedidaDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'UND' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  codigo: string;

  @ApiProperty({ example: 'Unidad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: '94' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigo_dian?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateCategoriaArticuloDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'MERCANCIA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo: string;

  @ApiProperty({ example: 'Mercancía para la Venta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: '143505' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuenta_inventario?: string;

  @ApiPropertyOptional({ example: '613505' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuenta_costo_venta?: string;

  @ApiPropertyOptional({ example: '513505' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuenta_gasto?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateBodegaDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'BOD-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo: string;

  @ApiProperty({ example: 'Bodega Principal Central' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'Carlos Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  responsable?: string;

  @ApiPropertyOptional({ example: 'Zona Industrial Calle 10 # 45-20' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateTipoMovimientoDto {
  @ApiPropertyOptional({ description: 'ID de la empresa tenant (null = global)' })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'ENT_COMPRA' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo: string;

  @ApiProperty({ example: 'Entrada por Compra / Recepción' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'ENTRADA' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  naturaleza?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  afecta_costo_promedio?: boolean;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuenta_inventario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuenta_costo_venta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuenta_gasto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  responsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  naturaleza?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  afecta_costo_promedio?: boolean;
}
