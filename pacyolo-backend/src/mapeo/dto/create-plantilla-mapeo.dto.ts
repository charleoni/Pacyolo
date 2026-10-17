import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TipoConceptoMapeo } from '../entities/plantilla-mapeo.entity.js';

export class CreatePlantillaMapeoDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({
    example: 'COMPRA_INVENTARIO',
    description: 'Código único mnemónico del concepto de negocio para integraciones o interfaces',
  })
  @IsString()
  @IsNotEmpty()
  codigo_concepto: string;

  @ApiProperty({
    example: 'Compra de Mercancías e Inventarios para la Venta',
    description: 'Nombre visible y descriptivo para el contador o usuario',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    example: 'Causa la entrada de inventario a la 1435 y la cuenta por pagar a proveedores a la 220505',
    description: 'Detalle o descripción del flujo',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    enum: TipoConceptoMapeo,
    default: TipoConceptoMapeo.COMPRA_GASTO,
    description: 'COMPRA_GASTO (proveedores/compras) o VENTA_INGRESO (facturación clientes)',
  })
  @IsEnum(TipoConceptoMapeo)
  @IsOptional()
  tipo_concepto?: TipoConceptoMapeo;

  @ApiProperty({
    description: 'ID de la cuenta auxiliar del PUC al Débito (ej: 1435 para inventario o 513505 para aseo)',
  })
  @IsUUID()
  @IsNotEmpty()
  cuenta_debito_id: string;

  @ApiProperty({
    description: 'ID de la cuenta auxiliar del PUC al Crédito (ej: 220505 para proveedores o 233510 para aseo por pagar)',
  })
  @IsUUID()
  @IsNotEmpty()
  cuenta_credito_id: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['IVA_19_DESCONTABLE', 'RETE_COMPRAS_2.5', 'RETEICA_BOGOTA_9.66'],
    description: 'Códigos de las reglas tributarias que aplican por defecto a este concepto',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reglas_impuestos_codigos?: string[];

  @ApiPropertyOptional({ default: true, description: 'Indica si este concepto activa el motor de retenciones' })
  @IsBoolean()
  @IsOptional()
  aplica_retencion?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Estado activo de la plantilla' })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
