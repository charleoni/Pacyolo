import { Component, signal, HostListener, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EmpresaSesion } from '../../core/models/auth.model';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <!-- Navbar Superior -->
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
              PY
            </div>
            <div>
              <span class="font-bold text-base tracking-tight text-white block leading-tight">PACYOLO</span>
              <span class="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Ledger NIIF</span>
            </div>
          </div>

          <!-- Selector de Empresa Tenant Activa -->
          <div class="relative flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <span class="text-xs text-slate-400">Tenant:</span>
            <select
              [value]="authService.empresaActiva()?.empresa_id"
              (change)="onCambiarEmpresa($event)"
              class="bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none cursor-pointer"
            >
              @for (emp of authService.usuario()?.empresas || []; track emp.empresa_id) {
                <option [value]="emp.empresa_id" class="bg-slate-900 text-slate-200">
                  {{ emp.razon_social }} (NIT: {{ emp.nit }}) - [{{ emp.rol }}]
                </option>
              }
            </select>
          </div>
        </div>

        <!-- Usuario & Logout -->
        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-xs font-semibold text-white block leading-tight">
              {{ authService.usuario()?.nombres }} {{ authService.usuario()?.apellidos }}
            </span>
            <span class="text-[10px] text-indigo-400 font-mono">
              {{ authService.empresaActiva()?.rol || 'SUPER_ADMIN' }}
            </span>
          </div>

          <button
            (click)="authService.logout()"
            class="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <!-- Sub-Barra de Navegación de Features -->
      <nav class="border-b border-slate-800 bg-slate-900/40 px-6 flex items-center gap-2">
        <a
          routerLink="/dashboard"
          routerLinkActive="border-indigo-500 text-white font-medium"
          [routerLinkActiveOptions]="{ exact: true }"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📊 Resumen
        </a>
        <a
          routerLink="/dashboard/puc"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📑 Catálogo PUC NIIF
        </a>
        <a
          routerLink="/dashboard/terceros"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📇 Terceros (DIAN)
        </a>
        <a
          routerLink="/dashboard/cxp"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📦 Compras & CxP
        </a>
        <a
          routerLink="/dashboard/asientos"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📖 Libro Diario
        </a>
        <a
          routerLink="/dashboard/borradores"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📥 Borradores Integración
        </a>
        <a
          routerLink="/dashboard/usuarios"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          👥 Equipo & Roles RBAC
        </a>
        <a
          routerLink="/dashboard/auditoria"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          🛡️ Pistas de Auditoría
        </a>

        <a
          routerLink="/dashboard/parametros"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition inline-flex items-center gap-1.5"
        >
          <span>⚙️ Parámetros</span>
        </a>
      </nav>

      <!-- Contenedor Principal -->
      <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class DashboardLayoutComponent {
  public readonly authService = inject(AuthService);

  onCambiarEmpresa(event: Event): void {
    const empresaId = (event.target as HTMLSelectElement).value;
    const emp = this.authService.usuario()?.empresas.find((e) => e.empresa_id === empresaId);
    if (emp) {
      this.authService.seleccionarEmpresa(emp);
    }
  }
}
