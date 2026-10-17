import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
} from 'class-validator';
import {
  RegimenTributario,
  ModoContabilizacion,
} from '../entities/empresa.entity.js';

export class CreateEmpresaDto {
  @ApiProperty({ example: '900123456', description: 'NIT de la empresa sin dígito de verificación' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nit: string;

  @ApiPropertyOptional({ example: '7', description: 'Dígito de verificación (se autocalcula si no se envía)' })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  dv?: string;

  @ApiProperty({ example: 'Distribuidora del Norte S.A.S.', description: 'Razón social legal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  razon_social: string;

  @ApiPropertyOptional({ example: 'DisNorte', description: 'Nombre comercial' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre_comercial?: string;

  @ApiPropertyOptional({
    enum: RegimenTributario,
    default: RegimenTributario.COMUN,
    description: 'Régimen fiscal ante la DIAN',
  })
  @IsEnum(RegimenTributario)
  @IsOptional()
  regimen_tributario?: RegimenTributario;

  @ApiPropertyOptional({ example: '4649', description: 'Código de actividad económica CIIU principal' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  codigo_actividad_ciiu?: string;

  @ApiPropertyOptional({
    enum: ModoContabilizacion,
    default: ModoContabilizacion.INMEDIATA,
    description: 'Modo en que se procesan las transacciones enviadas por API externa',
  })
  @IsEnum(ModoContabilizacion)
  @IsOptional()
  modo_contabilizacion_integracion?: ModoContabilizacion;

  @ApiPropertyOptional({ example: 'contacto@disnorte.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Calle 100 # 15-20, Bogotá' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ example: '11001', description: 'Código DANE del municipio (ej. 11001 para Bogotá)' })
  @IsString()
  @IsOptional()
  codigo_municipio?: string;
}
