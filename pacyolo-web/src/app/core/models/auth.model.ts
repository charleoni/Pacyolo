export interface UsuarioSesion {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  es_super_admin: boolean;
  empresas: EmpresaSesion[];
}

export interface EmpresaSesion {
  empresa_id: string;
  razon_social: string;
  nit: string;
  rol: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: UsuarioSesion;
}
