import { RolUsuario } from '../../usuarios/enums/rol-usuario.enum.js';

export interface JwtPayloadEmpresa {
  empresa_id: string;
  razon_social: string;
  nit: string;
  rol: RolUsuario;
}

export interface JwtPayload {
  sub: string; // usuario.id
  email: string;
  nombres: string;
  apellidos: string;
  es_super_admin: boolean;
  empresas: JwtPayloadEmpresa[];
}
