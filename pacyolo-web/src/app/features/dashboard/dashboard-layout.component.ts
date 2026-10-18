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

        <!-- Menú Desplegable Vertical: Parámetros -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleMenuParametros($event)"
            [class]="esRutaParametrosActiva() ? 'border-indigo-500 text-white font-medium' : 'text-slate-400 hover:text-slate-200 border-transparent'"
            class="px-4 py-3 text-xs border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer focus:outline-none select-none"
          >
            <span>⚙️ Parámetros</span>
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200 text-slate-400"
              [class.rotate-180]="menuParametrosAbierto()"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          @if (menuParametrosAbierto()) {
            <div
              (click)="$event.stopPropagation()"
              class="absolute left-0 mt-1 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div class="px-3.5 py-1.5 border-b border-slate-800/80 mb-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Configuración del Sistema</span>
              </div>

              <a
                routerLink="/dashboard/parametros/maestras"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenuParametros()"
                class="flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm shrink-0">
                  ⚙️
                </div>
                <div>
                  <span class="block font-medium text-slate-200 leading-snug">Tablas Maestras</span>
                  <span class="text-[10px] text-slate-400 leading-tight block">Tipos de doc, regímenes y catálogos sin enums</span>
                </div>
              </a>
            </div>
          }
        </div>
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
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  menuParametrosAbierto = signal<boolean>(false);

  toggleMenuParametros(event: MouseEvent): void {
    event.stopPropagation();
    this.menuParametrosAbierto.update((v) => !v);
  }

  cerrarMenuParametros(): void {
    this.menuParametrosAbierto.set(false);
  }

  esRutaParametrosActiva(): boolean {
    const url = this.router.url;
    return url.includes('/parametros') || url.includes('/configuracion');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrarMenuParametros();
    }
  }

  onCambiarEmpresa(event: Event): void {
    const empresaId = (event.target as HTMLSelectElement).value;
    const emp = this.authService.usuario()?.empresas.find((e) => e.empresa_id === empresaId);
    if (emp) {
      this.authService.seleccionarEmpresa(emp);
    }
  }
}
