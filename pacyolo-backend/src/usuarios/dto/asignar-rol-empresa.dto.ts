import { IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '../enums/rol-usuario.enum.js';

export class AsignarRolEmpresaDto {
  @ApiProperty({
    description: 'ID del usuario a vincular',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsNotEmpty()
  @IsUUID()
  usuario_id: string;

  @ApiProperty({
    description: 'ID de la empresa tenant',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty()
  @IsUUID()
  empresa_id: string;

  @ApiProperty({
    description: 'Rol asignado al usuario en esta empresa',
    enum: RolUsuario,
    example: RolUsuario.CONTADOR_LIDER,
  })
  @IsNotEmpty()
  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @ApiPropertyOptional({
    description: 'Email o identificación de quien realiza la asignación',
    example: 'admin@empresa.com',
  })
  @IsOptional()
  asignado_por?: string;
}
