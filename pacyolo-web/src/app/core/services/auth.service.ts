import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, UsuarioSesion, EmpresaSesion } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/v1';
  private readonly TOKEN_KEY = 'pacyolo_token';
  private readonly USER_KEY = 'pacyolo_user';
  private readonly EMPRESA_KEY = 'pacyolo_empresa_activa';

  // Signals para estado reactivo del usuario
  readonly token = signal<string | null>(this.getStoredToken());
  readonly usuario = signal<UsuarioSesion | null>(this.getStoredUser());
  readonly empresaActiva = signal<EmpresaSesion | null>(this.getStoredEmpresa());

  readonly isAuthenticated = computed(() => !!this.token());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        this.token.set(res.access_token);
        this.usuario.set(res.usuario);
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.usuario));

        // Asignar primera empresa por defecto si existe
        if (res.usuario.empresas && res.usuario.empresas.length > 0) {
          this.seleccionarEmpresa(res.usuario.empresas[0]);
        }
      }),
    );
  }

  seleccionarEmpresa(empresa: EmpresaSesion): void {
    this.empresaActiva.set(empresa);
    localStorage.setItem(this.EMPRESA_KEY, JSON.stringify(empresa));
  }

  logout(): void {
    this.token.set(null);
    this.usuario.set(null);
    this.empresaActiva.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.EMPRESA_KEY);
    this.router.navigate(['/login']);
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('[AuthService] El token JWT ha expirado. Limpiando sesión.');
          localStorage.removeItem(this.TOKEN_KEY);
          return null;
        }
      }
    } catch {
      // Ignorar si el token no es decodificable
    }

    return token;
  }

  private getStoredUser(): UsuarioSesion | null {
    if (typeof localStorage === 'undefined') return null;
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  private getStoredEmpresa(): EmpresaSesion | null {
    if (typeof localStorage === 'undefined') return null;
    const e = localStorage.getItem(this.EMPRESA_KEY);
    return e ? JSON.parse(e) : null;
  }
}
