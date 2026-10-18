import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { AsignarRolEmpresaDto } from './dto/asignar-rol-empresa.dto.js';
import { RolUsuario } from './enums/rol-usuario.enum.js';

@ApiTags('Usuarios & Control de Acceso (RBAC)')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear o invitar nuevo usuario al sistema con rol asignado',
    description: 'Crea el registro de identidad con contraseña hasheada y lo asocia a su empresa/rol inicial.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  async create(@Body() dto: CreateUsuarioDto) {
    return await this.usuariosService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de un usuario y sus empresas asignadas' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usuariosService.findOne(id);
  }

  @Get('empresa/:empresa_id')
  @ApiOperation({ summary: 'Listar equipo de trabajo y roles asignados en una empresa tenant' })
  async findByEmpresa(@Param('empresa_id', ParseUUIDPipe) empresa_id: string) {
    return await this.usuariosService.findByEmpresa(empresa_id);
  }

  @Post('asignar-rol')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar o cambiar el rol de un usuario en una empresa' })
  async asignarRol(@Body() dto: AsignarRolEmpresaDto) {
    return await this.usuariosService.asignarRolEmpresa(dto);
  }

  @Delete(':usuario_id/empresa/:empresa_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar o desactivar acceso de un usuario a una empresa' })
  async desactivar(
    @Param('usuario_id', ParseUUIDPipe) usuario_id: string,
    @Param('empresa_id', ParseUUIDPipe) empresa_id: string,
  ) {
    return await this.usuariosService.desactivarDeEmpresa(usuario_id, empresa_id);
  }
}
