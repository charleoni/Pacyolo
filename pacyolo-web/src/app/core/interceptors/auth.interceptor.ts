import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
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
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        notificationService.error(
          'Su sesión ha expirado o no tiene autorización para realizar esta acción. Por favor verifique sus credenciales.',
          'Sesión No Autorizada (401)',
        );
      }
      return throwError(() => error);
    }),
  );
};
