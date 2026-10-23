import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrdenCompraLineaDto {
  @ApiProperty({ example: 'uuid-articulo' })
  @IsUUID()
  @IsNotEmpty()
  articulo_id: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad_solicitada: number;

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

export class CreateOrdenCompraDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiPropertyOptional({ example: 'OC-0001' })
  @IsOptional()
  @IsString()
  numero_orden?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  proveedor_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bodega_destino_id?: string;

  @ApiProperty({ example: '2026-10-19' })
  @IsString()
  @IsNotEmpty()
  fecha_emision: string;

  @ApiPropertyOptional({ example: '2026-10-25' })
  @IsOptional()
  @IsString()
  fecha_entrega_esperada?: string;

  @ApiPropertyOptional({ example: 'CREDITO', enum: ['CONTADO', 'CREDITO'] })
  @IsOptional()
  @IsEnum(['CONTADO', 'CREDITO'])
  condicion_pago?: 'CONTADO' | 'CREDITO';

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dias_credito?: number;

  @ApiPropertyOptional({ example: '2026-11-19' })
  @IsOptional()
  @IsString()
  fecha_vencimiento?: string;

  @ApiPropertyOptional({ example: 'TRANSFERENCIA' })
  @IsOptional()
  @IsString()
  metodo_pago?: string;

  @ApiPropertyOptional({ example: 'FAC-98432' })
  @IsOptional()
  @IsString()
  numero_factura_proveedor?: string;

  @ApiPropertyOptional({ example: 'Pedido urgente para reposición' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [OrdenCompraLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraLineaDto)
  lineas: OrdenCompraLineaDto[];
}

export class UpdateEstadoOrdenCompraDto {
  @ApiProperty({
    example: 'APROBADA',
    enum: ['BORRADOR', 'APROBADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_TOTAL', 'CANCELADA'],
  })
  @IsEnum(['BORRADOR', 'APROBADA', 'RECIBIDA_PARCIAL', 'RECIBIDA_TOTAL', 'CANCELADA'])
  estado: 'BORRADOR' | 'APROBADA' | 'RECIBIDA_PARCIAL' | 'RECIBIDA_TOTAL' | 'CANCELADA';
}

export class CausarOrdenCompraDto {
  @ApiPropertyOptional({ example: 'FAC-9988' })
  @IsOptional()
  @IsString()
  numero_factura_proveedor?: string;

  @ApiPropertyOptional({ example: '2026-10-22' })
  @IsOptional()
  @IsString()
  fecha_factura?: string;

  @ApiPropertyOptional({ example: 'COMPRA_INVENTARIO' })
  @IsOptional()
  @IsString()
  codigo_concepto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  glosa?: string;
}
