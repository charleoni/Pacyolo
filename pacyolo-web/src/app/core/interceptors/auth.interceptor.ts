import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  const empresaActiva = authService.empresaActiva();

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (empresaActiva) {
    headers = headers.set('x-empresa-id', empresaActiva.empresa_id);
  }

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};
