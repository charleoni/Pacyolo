import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticuloDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'ART-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ example: 'Cuaderno Profesional 100 Hojas' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 'INVENTARIABLE', enum: ['INVENTARIABLE', 'SERVICIO', 'CONSUMIBLE'] })
  @IsEnum(['INVENTARIABLE', 'SERVICIO', 'CONSUMIBLE'])
  tipo_articulo: 'INVENTARIABLE' | 'SERVICIO' | 'CONSUMIBLE';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unidad_medida_id?: string;

  @ApiPropertyOptional({ example: '7701234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigo_barras?: string;

  @ApiPropertyOptional({ example: 8500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_venta_sugerido?: number;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_promedio?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_minimo?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_maximo?: number;

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @IsNumber()
  tarifa_iva?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  tarifa_inc?: number;

  @ApiPropertyOptional({ example: '143505' })
  @IsOptional()
  @IsString()
  cuenta_inventario?: string;

  @ApiPropertyOptional({ example: '613505' })
  @IsOptional()
  @IsString()
  cuenta_costo_venta?: string;

  @ApiPropertyOptional({ example: '513505' })
  @IsOptional()
  @IsString()
  cuenta_gasto?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class UpdateArticuloDto extends CreateArticuloDto {}

export class EntradaLineaDto {
  @ApiProperty({ example: 'uuid-articulo' })
  @IsUUID()
  @IsNotEmpty()
  articulo_id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  @Min(0)
  costo_unitario: number;
}

export class CreateEntradaAlmacenDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiPropertyOptional({ example: 'EA-0001' })
  @IsOptional()
  @IsString()
  numero_entrada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orden_compra_id?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  proveedor_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  bodega_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tipo_movimiento_id?: string;

  @ApiPropertyOptional({ example: 'REM-8921' })
  @IsOptional()
  @IsString()
  numero_remision_proveedor?: string;

  @ApiProperty({ example: '2026-10-19' })
  @IsString()
  @IsNotEmpty()
  fecha_entrada: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [EntradaLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntradaLineaDto)
  lineas: EntradaLineaDto[];
}

export class NotaAjusteLineaDto {
  @ApiProperty()
  @IsUUID()
  articulo_id: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA'] })
  @IsEnum(['ENTRADA', 'SALIDA'])
  tipo_movimiento: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_unitario?: number;
}

export class CreateNotaAjusteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiPropertyOptional({ example: 'AJ-0001' })
  @IsOptional()
  @IsString()
  numero_nota?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  bodega_id: string;

  @ApiProperty({ enum: ['SOBRANTE', 'FALTANTE_MERMA', 'CIERRE_INVENTARIO_FISICO'] })
  @IsEnum(['SOBRANTE', 'FALTANTE_MERMA', 'CIERRE_INVENTARIO_FISICO'])
  tipo_ajuste: 'SOBRANTE' | 'FALTANTE_MERMA' | 'CIERRE_INVENTARIO_FISICO';

  @ApiProperty({ example: '2026-10-19' })
  @IsString()
  @IsNotEmpty()
  fecha_ajuste: string;

  @ApiProperty({ example: 'Ajuste por conteo físico de cierre mensual' })
  @IsString()
  @IsNotEmpty()
  justificacion: string;

  @ApiProperty({ type: [NotaAjusteLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotaAjusteLineaDto)
  lineas: NotaAjusteLineaDto[];
}
