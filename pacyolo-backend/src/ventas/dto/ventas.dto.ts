import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoFacturaVenta, CondicionPagoVenta } from '../entities/factura-venta.entity.js';
import { MotivoNotaCredito, TipoReembolsoNotaCredito } from '../entities/nota-credito-venta.entity.js';

export class PagoMixtoDto {
  @IsString()
  @IsNotEmpty()
  medio: string; // EFECTIVO, BANCOS, CREDITO

  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsUUID()
  @IsOptional()
  cuenta_id?: string;
}

export class CreateFacturaVentaLineaDto {
  @IsUUID()
  @IsNotEmpty()
  articulo_id: string;

  @IsUUID()
  @IsOptional()
  bodega_id?: string;

  @IsNumber()
  @Min(0.0001, { message: 'La cantidad debe ser mayor a cero' })
  cantidad: number;

  @IsNumber()
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precio_unitario: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  porcentaje_descuento?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarifa_iva?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarifa_inc?: number;
}

export class CreateFacturaVentaDto {
  @IsUUID()
  @IsNotEmpty()
  cliente_id: string;

  @IsEnum(TipoFacturaVenta)
  @IsOptional()
  tipo_documento?: TipoFacturaVenta;

  @IsString()
  @IsNotEmpty()
  fecha_emision: string;

  @IsString()
  @IsNotEmpty()
  fecha_vencimiento: string;

  @IsEnum(CondicionPagoVenta)
  @IsOptional()
  condicion_pago?: CondicionPagoVenta;

  @IsString()
  @IsOptional()
  medio_pago?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  propina?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  retefuente?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reteica?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reteiva?: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFacturaVentaLineaDto)
  lineas: CreateFacturaVentaLineaDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PagoMixtoDto)
  pagos_mixtos?: PagoMixtoDto[];
}

export class CreateNotaCreditoLineaDto {
  @IsUUID()
  @IsNotEmpty()
  articulo_id: string;

  @IsUUID()
  @IsOptional()
  bodega_id?: string;

  @IsNumber()
  @Min(0.0001, { message: 'La cantidad a devolver debe ser mayor a cero' })
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio_unitario: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarifa_iva?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tarifa_inc?: number;
}

export class CreateNotaCreditoDto {
  @IsUUID()
  @IsNotEmpty()
  factura_id: string;

  @IsString()
  @IsNotEmpty()
  fecha_emision: string;

  @IsEnum(MotivoNotaCredito)
  motivo_dian: MotivoNotaCredito;

  @IsEnum(TipoReembolsoNotaCredito)
  tipo_reembolso: TipoReembolsoNotaCredito;

  @IsUUID()
  @IsOptional()
  cuenta_reembolso_id?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNotaCreditoLineaDto)
  lineas: CreateNotaCreditoLineaDto[];
}
