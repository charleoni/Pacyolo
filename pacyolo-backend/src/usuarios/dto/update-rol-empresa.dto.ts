import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RolUsuario } from '../enums/rol-usuario.enum.js';

export class UpdateRolEmpresaDto {
  @ApiProperty({
    enum: RolUsuario,
    example: RolUsuario.CONTADOR_LIDER,
    description: 'Nuevo rol a asignar al usuario dentro de la empresa',
  })
  @IsEnum(RolUsuario, { message: 'El rol debe ser un valor válido del catálogo de roles.' })
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  rol: RolUsuario;

  @ApiPropertyOptional({
    example: 'usr-admin-1',
    description: 'ID del administrador que realiza la modificación',
  })
  @IsOptional()
  @IsString()
  modificado_por?: string;
}
