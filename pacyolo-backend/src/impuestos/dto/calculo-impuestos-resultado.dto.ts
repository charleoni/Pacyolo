import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoImpuesto } from '../entities/impuesto-regla.entity.js';

export class DetalleImpuestoCalculadoDto {
  @ApiProperty()
  regla_id: string;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ enum: TipoImpuesto })
  tipo_impuesto: TipoImpuesto;

  @ApiProperty({ description: 'Porcentaje o tarifa aplicada' })
  porcentaje: number;

  @ApiProperty({ description: 'Base monetaria evaluada' })
  base_calculo: number;

  @ApiProperty({ description: 'Base mínima legal configurada' })
  base_minima: number;

  @ApiProperty({ description: 'Indica si superó la base mínima y fue retenido/liquidado' })
  aplica: boolean;

  @ApiPropertyOptional({ description: 'Motivo si no aplicó la retención' })
  motivo_no_aplica?: string;

  @ApiProperty({ description: 'Monto liquidado en COP' })
  valor: number;

  @ApiProperty({ description: 'Cuenta contable del PUC afectada' })
  cuenta_afectada: {
    id: string;
    codigo: string;
    nombre: string;
    efecto: 'DEBITO' | 'CREDITO';
  };
}

export class LineaSugeridaDto {
  @ApiProperty()
  cuenta_id: string;

  @ApiProperty()
  cuenta_codigo: string;

  @ApiProperty()
  cuenta_nombre: string;

  @ApiProperty()
  debito: number;

  @ApiProperty()
  credito: number;

  @ApiProperty()
  base_impuesto: number;

  @ApiProperty()
  glosa_detalle: string;
}

export class CalculoImpuestosResultadoDto {
  @ApiProperty({ example: 2500000 })
  subtotal: number;

  @ApiProperty({ example: 475000, description: 'Suma de impuestos generados o descontables (IVA)' })
  total_iva: number;

  @ApiProperty({ example: 86650, description: 'Suma de retenciones practicadas (Retefuente, ReteICA, ReteIVA)' })
  total_retenciones: number;

  @ApiProperty({
    example: 2888350,
    description: 'Valor neto financiero resultante (Subtotal + IVA - Retenciones para compras)',
  })
  total_neto: number;

  @ApiProperty({ type: [DetalleImpuestoCalculadoDto] })
  detalles: DetalleImpuestoCalculadoDto[];

  @ApiProperty({
    type: [LineaSugeridaDto],
    description: 'Líneas contables pre-calculadas listas para inyectar en el asiento de causación',
  })
  lineas_asiento_sugeridas: LineaSugeridaDto[];
}
