import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('Autenticación & Sesión (JWT)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión con correo y contraseña',
    description: 'Valida credenciales con BCrypt y retorna un token JWT que incluye el contexto multi-tenant de las empresas y roles asignados al usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa. Retorna access_token y perfil de empresas.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta de usuario inactiva.',
  })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @Get('perfil')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil y empresas del usuario autenticado',
    description: 'Requiere header Bearer Token. Retorna los datos personales del usuario y la lista de empresas donde tiene membresía activa.',
  })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o expirado' })
  async getPerfil(@Request() req: any) {
    return await this.authService.getPerfil(req.user.sub);
  }
}
