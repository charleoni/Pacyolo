import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { MetodoPago } from '../entities/pago-cxp.entity.js';

export class RegistrarPagoCxpDto {
  @ApiProperty({ description: 'ID de la empresa (Tenant)' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({ description: 'ID de la cuenta por pagar a cancelar o abonar' })
  @IsUUID()
  @IsNotEmpty()
  cuenta_por_pagar_id: string;

  @ApiProperty({ description: 'ID de la cuenta auxiliar de Banco o Caja donde se origina el desembolso (ej: 11100501)' })
  @IsUUID()
  @IsNotEmpty()
  cuenta_banco_id: string;

  @ApiProperty({ example: 1000000, description: 'Valor del abono o pago total en COP' })
  @IsNumber()
  @Min(0.01)
  monto_pago: number;

  @ApiProperty({ example: '2026-10-17', description: 'Fecha en la que se efectuó el pago (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fecha_pago: string;

  @ApiPropertyOptional({
    enum: MetodoPago,
    default: MetodoPago.TRANSFERENCIA,
    description: 'TRANSFERENCIA, CONSIGNACION, CHEQUE, EFECTIVO',
  })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodo_pago?: MetodoPago;

  @ApiPropertyOptional({ example: 'TRX-9481920', description: 'Número de aprobación o soporte bancario' })
  @IsString()
  @IsOptional()
  referencia_transaccion?: string;

  @ApiPropertyOptional({ example: 'Pago total factura proveedor por transferencia Bancolombia', description: 'Observación' })
  @IsString()
  @IsOptional()
  glosa?: string;
}
