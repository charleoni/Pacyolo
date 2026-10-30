import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoCuentaBancaria } from '../entities/cuenta-bancaria.entity.js';
import { TipoMovimientoExtracto } from '../entities/extracto-bancario.entity.js';

// =========================================================================
// CAJAS MENORES
// =========================================================================

export class CreateCajaMenorDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsUUID()
  responsable_id: string;

  @IsUUID()
  cuenta_puc_id: string; // Cuenta 110510

  @IsNumber()
  @Min(0.01)
  monto_fondo_fijo: number;

  @IsOptional()
  @IsUUID()
  cuenta_banco_origen_id?: string; // Para generar el comprobante de apertura inicial

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateGastoCajaMenorDto {
  @IsUUID()
  caja_menor_id: string;

  @IsDateString()
  fecha_gasto: string;

  @IsUUID()
  tercero_id: string;

  @IsString()
  concepto: string;

  @IsUUID()
  cuenta_gasto_id: string; // Cuenta 51/52

  @IsOptional()
  @IsUUID()
  centro_costo_id?: string;

  @IsNumber()
  @Min(0.01)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  iva?: number;

  @IsOptional()
  @IsNumber()
  retefuente?: number;

  @IsNumber()
  @Min(0.01)
  total: number;

  @IsOptional()
  @IsString()
  soporte_factura_ref?: string;
}

export class CreateArqueoCajaMenorDto {
  @IsUUID()
  caja_menor_id: string;

  @IsDateString()
  fecha_arqueo: string;

  @IsOptional()
  desglose_efectivo?: Record<string, number>;

  @IsNumber()
  @Min(0)
  total_efectivo_fisico: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ReembolsoCajaMenorDto {
  @IsUUID()
  caja_menor_id: string;

  @IsDateString()
  fecha_egreso: string;

  @IsUUID()
  cuenta_banco_pago_id: string; // Cuenta 1110 desde donde se gira el cheque o transferencia

  @IsArray()
  @IsUUID('4', { each: true })
  gastos_ids: string[]; // Lista de vales que se están reembolsando

  @IsOptional()
  @IsString()
  observaciones?: string;
}

// =========================================================================
// CUENTAS BANCARIAS
// =========================================================================

export class CreateCuentaBancariaDto {
  @IsString()
  banco_nombre: string;

  @IsEnum(TipoCuentaBancaria)
  tipo_cuenta: TipoCuentaBancaria;

  @IsString()
  numero_cuenta: string;

  @IsUUID()
  cuenta_puc_id: string;

  @IsOptional()
  @IsString()
  moneda?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

// =========================================================================
// EXTRACTOS BANCARIOS
// =========================================================================

export class LineaExtractoImportDto {
  @IsDateString()
  fecha: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsEnum(TipoMovimientoExtracto)
  tipo_movimiento: TipoMovimientoExtracto;

  @IsNumber()
  @Min(0.01)
  valor: number;
}

export class ImportarExtractoDto {
  @IsUUID()
  cuenta_bancaria_id: string;

  @IsNumber()
  periodo_anio: number;

  @IsNumber()
  periodo_mes: number;

  @IsDateString()
  fecha_corte: string;

  @IsNumber()
  saldo_inicial: number;

  @IsNumber()
  saldo_final: number;

  @IsOptional()
  @IsString()
  nombre_archivo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaExtractoImportDto)
  lineas: LineaExtractoImportDto[];
}

// =========================================================================
// CONCILIACIÓN BANCARIA Y CAUSACIÓN DE NOTAS
// =========================================================================

export class EjecutarConciliacionDto {
  @IsUUID()
  cuenta_bancaria_id: string;

  @IsUUID()
  extracto_id: string;

  @IsNumber()
  periodo_anio: number;

  @IsNumber()
  periodo_mes: number;

  @IsDateString()
  fecha_conciliacion: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CausarNotaBancariaDto {
  @IsUUID()
  cuenta_bancaria_id: string;

  @IsUUID()
  extracto_linea_id: string;

  @IsDateString()
  fecha_asiento: string;

  @IsString()
  tipo_nota: 'GMF_4X1000' | 'COMISION_BANCARIA' | 'INTERES_GANADO';

  @IsUUID()
  cuenta_contrapartida_id: string; // Ej: 511595 para 4x1000, 530515 para comisiones, 421005 para intereses

  @IsOptional()
  @IsUUID()
  tercero_banco_id?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
