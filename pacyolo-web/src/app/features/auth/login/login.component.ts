import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 mb-4 shadow-lg shadow-indigo-500/20">
            <span class="text-2xl font-black text-white tracking-wider">PY</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">PACYOLO Core Ledger</h1>
          <p class="text-xs text-slate-400 mt-1">Contabilidad NIIF Multi-tenant & API-First</p>
        </div>

        @if (errorMensaje()) {
          <div class="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMensaje() }}</span>
          </div>
        }

        <form (ngSubmit)="onLogin()" class="space-y-5">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Correo Corporativo</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="contador@empresa.com"
              class="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Contraseña</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            [disabled]="cargando()"
            class="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 cursor-pointer"
          >
            @if (cargando()) {
              <span>Verificando credenciales...</span>
            } @else {
              <span>Iniciar Sesión en el Ledger</span>
            }
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-800 text-center">
          <p class="text-[11px] text-slate-500">
            Seguridad Multi-Tenant blindada con JWT & Hashing BCrypt. DUR 2420 Colombia.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = signal(false);
  errorMensaje = signal<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMensaje.set('Por favor ingrese su correo y contraseña.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.message || 'Error de autenticación. Verifique sus credenciales.';
        this.errorMensaje.set(msg);
      },
    });
  }
}
