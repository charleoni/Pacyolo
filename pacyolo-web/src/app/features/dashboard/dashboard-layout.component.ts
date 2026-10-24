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
      <!-- Barra Superior y Navegación Sticky Global -->
      <div class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
        <!-- Navbar Superior -->
        <header class="border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
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
      <nav class="px-6 flex items-center gap-2">
        <a
          routerLink="/dashboard"
          routerLinkActive="border-indigo-500 text-white font-medium"
          [routerLinkActiveOptions]="{ exact: true }"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition"
        >
          📊 Resumen
        </a>

        <!-- Contenedor / Menú Contabilidad -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleMenu('contabilidad', $event)"
            [class]="esRutaContabilidadActiva() ? 'border-indigo-500 text-white font-medium' : 'text-slate-400 hover:text-slate-200 border-transparent'"
            class="px-4 py-3 text-xs border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer focus:outline-none select-none"
          >
            <span>📖 Contabilidad</span>
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200 text-slate-400"
              [class.rotate-180]="menuAbierto() === 'contabilidad'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          @if (menuAbierto() === 'contabilidad') {
            <div
              (click)="$event.stopPropagation()"
              class="absolute top-full left-0 mt-1 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div class="px-3 py-1 border-b border-slate-800/80 mb-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Módulo Contable</span>
              </div>

              <a
                routerLink="/dashboard/terceros"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>📇</span>
                <span>Maestro de Terceros</span>
              </a>

              <a
                routerLink="/dashboard/puc"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>📑</span>
                <span>Catálogo PUC NIIF</span>
              </a>

              <a
                routerLink="/dashboard/asientos"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>📖</span>
                <span>Libro Diario</span>
              </a>

              <a
                routerLink="/dashboard/borradores"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>📥</span>
                <span>Borradores Integración</span>
              </a>
            </div>
          }
        </div>

        <!-- Contenedor / Menú Abastecimiento & Stock -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleMenu('abastecimiento', $event)"
            [class]="esRutaAbastecimientoActiva() ? 'border-indigo-500 text-white font-medium' : 'text-slate-400 hover:text-slate-200 border-transparent'"
            class="px-4 py-3 text-xs border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer focus:outline-none select-none"
          >
            <span>📦 Abastecimiento & Stock</span>
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200 text-slate-400"
              [class.rotate-180]="menuAbierto() === 'abastecimiento'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          @if (menuAbierto() === 'abastecimiento') {
            <div
              (click)="$event.stopPropagation()"
              class="absolute top-full left-0 mt-1 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div class="px-3 py-1 border-b border-slate-800/80 mb-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gestión de Stock & Compras</span>
              </div>

              <a
                routerLink="/dashboard/inventarios/articulos"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>📦</span>
                <span>Catálogo de Artículos (NIC 2)</span>
              </a>

              <a
                routerLink="/dashboard/compras/ordenes"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>📑</span>
                <span>Órdenes de Compra (OC)</span>
              </a>

              <a
                routerLink="/dashboard/cxp"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>💰</span>
                <span>Cuentas por Pagar & Reportes</span>
              </a>
            </div>
          }
        </div>

        <a
          routerLink="/dashboard/parametros"
          routerLinkActive="border-indigo-500 text-white font-medium"
          class="px-4 py-3 text-xs text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition inline-flex items-center gap-1.5"
        >
          <span>⚙️ Parámetros</span>
        </a>

        <!-- Contenedor / Menú Seguridad del Sistema -->
        <div class="relative">
          <button
            type="button"
            (click)="toggleMenu('seguridad', $event)"
            [class]="esRutaSeguridadActiva() ? 'border-indigo-500 text-white font-medium' : 'text-slate-400 hover:text-slate-200 border-transparent'"
            class="px-4 py-3 text-xs border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer focus:outline-none select-none"
          >
            <span>🛡️ Seguridad del Sistema</span>
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200 text-slate-400"
              [class.rotate-180]="menuAbierto() === 'seguridad'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          @if (menuAbierto() === 'seguridad') {
            <div
              (click)="$event.stopPropagation()"
              class="absolute top-full left-0 mt-1 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div class="px-3 py-1 border-b border-slate-800/80 mb-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Control & Auditoría</span>
              </div>

              <a
                routerLink="/dashboard/usuarios"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>👥</span>
                <span>Equipo & Roles RBAC</span>
              </a>

              <a
                routerLink="/dashboard/auditoria"
                routerLinkActive="bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                (click)="cerrarMenus()"
                class="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
              >
                <span>🛡️</span>
                <span>Pistas de Auditoría</span>
              </a>
            </div>
          }
        </div>
      </nav>
      </div>

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

  menuAbierto = signal<'contabilidad' | 'abastecimiento' | 'seguridad' | null>(null);

  toggleMenu(menu: 'contabilidad' | 'abastecimiento' | 'seguridad', event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto.update((actual) => (actual === menu ? null : menu));
  }

  cerrarMenus(): void {
    this.menuAbierto.set(null);
  }

  esRutaContabilidadActiva(): boolean {
    const url = this.router.url;
    return (
      url.includes('/dashboard/terceros') ||
      url.includes('/dashboard/puc') ||
      url.includes('/dashboard/asientos') ||
      url.includes('/dashboard/borradores')
    );
  }

  esRutaAbastecimientoActiva(): boolean {
    const url = this.router.url;
    return (
      url.includes('/dashboard/inventarios') ||
      url.includes('/dashboard/compras') ||
      url.includes('/dashboard/cxp')
    );
  }

  esRutaSeguridadActiva(): boolean {
    const url = this.router.url;
    return (
      url.includes('/dashboard/usuarios') ||
      url.includes('/dashboard/auditoria')
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrarMenus();
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
