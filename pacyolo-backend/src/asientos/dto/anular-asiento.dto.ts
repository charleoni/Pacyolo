import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AnularAsientoDto {
  @ApiProperty({ example: 'Error en digitación de cuentas contables', description: 'Motivo formal de la anulación' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;

  @ApiPropertyOptional({ description: 'ID del usuario que autoriza la anulación' })
  @IsUUID()
  @IsOptional()
  usuario_id?: string;
}
