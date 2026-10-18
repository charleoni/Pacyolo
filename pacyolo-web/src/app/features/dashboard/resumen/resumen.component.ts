import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Panel de Control Contable</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Empresa activa: <span class="text-emerald-400 font-semibold">{{ authService.empresaActiva()?.razon_social }}</span>
            (NIT: {{ authService.empresaActiva()?.nit }})
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ● Ledger Conectado
          </span>
        </div>
      </div>

      <!-- Tarjetas de Métricas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span class="text-xs text-slate-400 block mb-1">Catálogo NIIF</span>
          <span class="text-2xl font-bold text-white">Activo</span>
          <p class="text-[11px] text-slate-500 mt-2">Árbol de 5 niveles con validación auxiliar</p>
        </div>

        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span class="text-xs text-slate-400 block mb-1">Motor de Partida Doble</span>
          <span class="text-2xl font-bold text-emerald-400">Balanceado</span>
          <p class="text-[11px] text-slate-500 mt-2">SUM(Débitos) == SUM(Créditos)</p>
        </div>

        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span class="text-xs text-slate-400 block mb-1">Cuentas por Pagar & Retenciones</span>
          <span class="text-2xl font-bold text-indigo-400">DUR 2420</span>
          <p class="text-[11px] text-slate-500 mt-2">Retefuente, ReteICA, ReteIVA e IVA</p>
        </div>

        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span class="text-xs text-slate-400 block mb-1">Seguridad & RBAC</span>
          <span class="text-2xl font-bold text-amber-400">{{ authService.empresaActiva()?.rol }}</span>
          <p class="text-[11px] text-slate-500 mt-2">Privilegios contextuales por tenant</p>
        </div>
      </div>

      <!-- Resumen de Capacidades -->
      <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 class="text-sm font-semibold text-white mb-3">Módulos Integrados del Core Ledger</h3>
        <ul class="text-xs text-slate-400 space-y-2">
          <li class="flex items-center gap-2">
            <span class="text-emerald-400">✔</span>
            <strong>Explorador del PUC:</strong> Consulta en tiempo real de cuentas contables, naturaleza débito/crédito y validación de imputabilidad.
          </li>
          <li class="flex items-center gap-2">
            <span class="text-emerald-400">✔</span>
            <strong>Libro Diario:</strong> Trazabilidad cronológica de comprobantes con anulación controlada por reversión NIIF.
          </li>
          <li class="flex items-center gap-2">
            <span class="text-emerald-400">✔</span>
            <strong>Bandeja de Borradores:</strong> Aprobación y rechazo dual para facturas y recaudos ingeridos desde APIs externas.
          </li>
          <li class="flex items-center gap-2">
            <span class="text-emerald-400">✔</span>
            <strong>Administración RBAC:</strong> Gestión de roles para contadores, auxiliares y administradores.
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class ResumenComponent {
  constructor(public readonly authService: AuthService) {}
}
