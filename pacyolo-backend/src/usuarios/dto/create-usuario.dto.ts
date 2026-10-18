import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '../enums/rol-usuario.enum.js';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'contador@empresa.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña en texto plano para ser hasheada con bcrypt (mínimo 6 caracteres)',
    example: 'ClaveSegura2026*',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Carlos Alberto',
  })
  @IsNotEmpty()
  @IsString()
  nombres: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Alcalá Martínez',
  })
  @IsNotEmpty()
  @IsString()
  apellidos: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+57 300 123 4567',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'ID de la empresa tenant a la que se vinculará de inmediato',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @ApiPropertyOptional({
    description: 'Rol que tendrá en la empresa asignada',
    enum: RolUsuario,
    default: RolUsuario.AUXILIAR_CONTABLE,
  })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;
}
