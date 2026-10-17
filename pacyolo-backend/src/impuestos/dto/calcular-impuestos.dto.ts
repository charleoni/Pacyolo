import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoOperacionTributaria {
  COMPRA_GASTO = 'COMPRA_GASTO', // CxP: retenciones descuentan al neto a pagar
  VENTA_INGRESO = 'VENTA_INGRESO', // CxC: retenciones son anticipos que el cliente descuenta
}

export class ImpuestoCalculoItemDto {
  @ApiProperty({ description: 'ID o Código de la regla tributaria a aplicar' })
  @IsString()
  @IsNotEmpty()
  regla_id_o_codigo: string;

  @ApiPropertyOptional({
    description: 'Base gravable específica para esta regla. Si se omite, se usa el subtotal general.',
    example: 2500000,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  base_especifica?: number;
}

export class CalcularImpuestosDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({
    enum: TipoOperacionTributaria,
    default: TipoOperacionTributaria.COMPRA_GASTO,
    description: 'COMPRA_GASTO (proveedores/CxP) o VENTA_INGRESO (clientes/CxC)',
  })
  @IsEnum(TipoOperacionTributaria)
  @IsNotEmpty()
  tipo_operacion: TipoOperacionTributaria;

  @ApiProperty({ example: 2500000, description: 'Subtotal o base gravable antes de impuestos y retenciones' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    type: [ImpuestoCalculoItemDto],
    description: 'Lista de reglas tributarias (IDs o códigos) a calcular sobre la operación',
    example: [
      { regla_id_o_codigo: 'IVA_19_DESCONTABLE' },
      { regla_id_o_codigo: 'RETE_COMPRAS_2.5' },
      { regla_id_o_codigo: 'RETEICA_BOGOTA_9.66' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImpuestoCalculoItemDto)
  reglas: ImpuestoCalculoItemDto[];
}
