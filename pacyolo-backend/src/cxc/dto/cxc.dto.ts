import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { MetodoRecaudo } from '../entities/recaudo-cxc.entity.js';

export class RegistrarRecaudoDto {
  @IsUUID()
  @IsNotEmpty()
  cuenta_por_cobrar_id: string;

  @IsUUID()
  @IsNotEmpty()
  cuenta_banco_id: string; // Cuenta auxiliar donde ingresa el dinero (1105xx Caja, 1110xx Banco)

  @IsNumber()
  @Min(0.01, { message: 'El monto de recaudo debe ser mayor a cero' })
  monto_recaudo: number;

  @IsString()
  @IsNotEmpty()
  fecha_recaudo: string;

  @IsEnum(MetodoRecaudo)
  @IsOptional()
  metodo_recaudo?: MetodoRecaudo;

  @IsString()
  @IsOptional()
  referencia_transaccion?: string;

  @IsString()
  @IsOptional()
  glosa?: string;
}
