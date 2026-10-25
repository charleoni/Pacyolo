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
  ValidateIf,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';

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
  @ValidateIf((o, v) => !!v)
  @IsUUID()
  categoria_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o, v) => !!v)
  @IsUUID()
  unidad_medida_id?: string;

  @ApiPropertyOptional({ example: '7701234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigo_barras?: string;

  @ApiPropertyOptional({ example: 8500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_venta_sugerido?: number;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo_promedio?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_minimo?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock_maximo?: number;

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tarifa_iva?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
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

export class UpdateArticuloDto extends PartialType(
  OmitType(CreateArticuloDto, [
    'empresa_id',
    'codigo',
    'tipo_articulo',
    'costo_promedio',
  ] as const),
) {}

export class EntradaLineaDto {
  @ApiProperty({ example: 'uuid-articulo' })
  @IsUUID()
  @IsNotEmpty()
  articulo_id: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiProperty({ example: 4500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo_unitario: number;

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  porcentaje_iva?: number;
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

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  causar_cxp?: boolean;

  @ApiPropertyOptional({ example: 'FE-9842' })
  @IsOptional()
  @IsString()
  numero_factura_proveedor?: string;

  @ApiPropertyOptional({ example: '2026-10-22' })
  @IsOptional()
  @IsString()
  fecha_factura?: string;

  @ApiPropertyOptional({ example: '2026-11-22' })
  @IsOptional()
  @IsString()
  fecha_vencimiento?: string;

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

  @ApiPropertyOptional({ enum: ['ENTRADA', 'SALIDA'] })
  @IsOptional()
  @IsEnum(['ENTRADA', 'SALIDA'])
  tipo_movimiento?: 'ENTRADA' | 'SALIDA';

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @Type(() => Number)
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

  @ApiProperty({
    enum: ['SOBRANTE', 'FALTANTE_MERMA', 'CIERRE_INVENTARIO_FISICO', 'DEVOLUCION_PROVEEDOR', 'DEVOLUCION_CLIENTE'],
    example: 'SOBRANTE',
  })
  @IsEnum(['SOBRANTE', 'FALTANTE_MERMA', 'CIERRE_INVENTARIO_FISICO', 'DEVOLUCION_PROVEEDOR', 'DEVOLUCION_CLIENTE'])
  tipo_ajuste: 'SOBRANTE' | 'FALTANTE_MERMA' | 'CIERRE_INVENTARIO_FISICO' | 'DEVOLUCION_PROVEEDOR' | 'DEVOLUCION_CLIENTE';

  @ApiProperty({ example: '2026-10-19' })
  @IsString()
  @IsNotEmpty()
  fecha_ajuste: string;

  @ApiProperty({ example: 'Ajuste por conteo físico de cierre mensual' })
  @IsString()
  @IsNotEmpty()
  justificacion: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  usuario_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creado_por?: string;

  @ApiProperty({ type: [NotaAjusteLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotaAjusteLineaDto)
  lineas: NotaAjusteLineaDto[];
}

export class TrasladoLineaDto {
  @ApiProperty({ example: 'uuid-articulo' })
  @IsUUID()
  @IsNotEmpty()
  articulo_id: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad: number;
}

export class CreateTrasladoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiProperty({ example: 'uuid-bodega-origen' })
  @IsUUID()
  @IsNotEmpty()
  bodega_origen_id: string;

  @ApiProperty({ example: 'uuid-bodega-destino' })
  @IsUUID()
  @IsNotEmpty()
  bodega_destino_id: string;

  @ApiProperty({ example: '2026-10-22' })
  @IsString()
  @IsNotEmpty()
  fecha_traslado: string;

  @ApiPropertyOptional({ example: 'Reabastecimiento de bodega secundaria' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [TrasladoLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrasladoLineaDto)
  lineas: TrasladoLineaDto[];
}
