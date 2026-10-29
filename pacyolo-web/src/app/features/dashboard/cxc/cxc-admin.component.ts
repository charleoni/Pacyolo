import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CxcService, CuentaPorCobrarItem, RecaudoCxcItem } from '../../../core/services/cxc.service';
import { ParametrosService } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TerceroLookupModalComponent, TerceroItem } from '../../../shared/components/tercero-lookup-modal.component';
import { PucLookupModalComponent, CuentaPucLookupItem } from '../../../shared/components/puc-lookup-modal.component';
import { TablePaginationComponent } from '../../../shared/components/table-pagination.component';

@Component({
  selector: 'app-cxc-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TerceroLookupModalComponent,
    PucLookupModalComponent,
    TablePaginationComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Encabezado del Módulo -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div class="flex items-center gap-3">
          <span class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
            💰
          </span>
          <div>
            <h1 class="text-xl font-bold text-white tracking-tight">Cuentas por Cobrar (CxC) & Cartera</h1>
            <p class="text-xs text-slate-400 mt-0.5">
              Control de saldos de clientes, Recibos de Caja (ING), Estados de Cuenta y Matriz de Antigüedad NIIF.
            </p>
          </div>
        </div>

        <!-- Pestañas de Navegación -->
        <div class="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            (click)="cambiarPestana('CARTERA')"
            [class]="pestanaActiva() === 'CARTERA' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            💰 Cartera Abierta
          </button>
          <button
            type="button"
            (click)="cambiarPestana('ESTADO_CUENTA')"
            [class]="pestanaActiva() === 'ESTADO_CUENTA' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            📑 Estado de Cuenta
          </button>
          <button
            type="button"
            (click)="cambiarPestana('EXTRACTO')"
            [class]="pestanaActiva() === 'EXTRACTO' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            📊 Extracto
          </button>
          <button
            type="button"
            (click)="cambiarPestana('EDADES')"
            [class]="pestanaActiva() === 'EDADES' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            📈 Matriz de Edades
          </button>
        </div>
      </div>

      <!-- PESTAÑA 1: CARTERA ABIERTA -->
      @if (pestanaActiva() === 'CARTERA') {
        <!-- Tarjetas de Resumen Financiero -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span class="text-xs text-slate-400 font-medium">Total Cartera Exigible</span>
            <div class="text-2xl font-black font-mono text-white mt-1">
              \${{ Number(resumenCartera().totalCartera || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
            </div>
            <span class="text-[11px] text-slate-500 mt-1 block">Saldo pendiente consolidado</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span class="text-xs text-slate-400 font-medium">Cartera Corriente (Al Día)</span>
            <div class="text-2xl font-black font-mono text-emerald-400 mt-1">
              \${{ Number(resumenCartera().totalCorriente || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
            </div>
            <span class="text-[11px] text-emerald-500/80 mt-1 block">Dentro de la fecha de pago pactada</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span class="text-xs text-slate-400 font-medium">Cartera Vencida (En Mora)</span>
            <div class="text-2xl font-black font-mono text-rose-400 mt-1">
              \${{ Number(resumenCartera().totalVencido || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
            </div>
            <span class="text-[11px] text-rose-500/80 mt-1 block">Superó la fecha límite de crédito</span>
          </div>
        </div>

        <!-- Tabla de Cartera -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="relative w-full sm:w-96">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                [(ngModel)]="busquedaTexto"
                (ngModelChange)="filtrarCartera()"
                placeholder="Buscar por factura, cliente o NIT..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>

            <!-- Filtro de Estado -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">Estado:</span>
              <select
                [(ngModel)]="filtroEstado"
                (ngModelChange)="cargarCartera()"
                class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="COBRADA_PARCIAL">Cobrada Parcial</option>
                <option value="COBRADA_TOTAL">Cobrada Total</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3.5">Factura</th>
                  <th class="p-3.5">Cliente</th>
                  <th class="p-3.5">Emisión</th>
                  <th class="p-3.5">Vencimiento</th>
                  <th class="p-3.5 text-right">Total Factura</th>
                  <th class="p-3.5 text-right">Saldo Pendiente</th>
                  <th class="p-3.5 text-center">Estado</th>
                  <th class="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-sans">
                @if (cargando()) {
                  <tr>
                    <td colspan="8" class="p-8 text-center text-slate-400">
                      <div class="inline-flex items-center gap-2">
                        <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                        Cargando cartera de clientes...
                      </div>
                    </td>
                  </tr>
                } @else if (carteraPaginada().length === 0) {
                  <tr>
                    <td colspan="8" class="p-8 text-center text-slate-500">
                      No se encontraron registros de cartera.
                    </td>
                  </tr>
                } @else {
                  @for (c of carteraPaginada(); track c.id) {
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="p-3.5 font-mono font-bold text-indigo-400">
                        {{ c.numero_factura }}
                      </td>
                      <td class="p-3.5">
                        <div class="font-semibold text-white">{{ c.tercero?.razon_social || c.tercero?.nombre_completo }}</div>
                        <div class="text-[11px] text-slate-400 font-mono">NIT: {{ c.tercero?.numero_identificacion }}</div>
                      </td>
                      <td class="p-3.5 text-slate-300">
                        {{ c.fecha_emision }}
                      </td>
                      <td class="p-3.5 font-mono" [class.text-rose-400]="esVencida(c.fecha_vencimiento, c.saldo_pendiente)">
                        {{ c.fecha_vencimiento }}
                        @if (esVencida(c.fecha_vencimiento, c.saldo_pendiente)) {
                          <span class="text-[10px] ml-1 font-bold text-rose-500">(Mora)</span>
                        }
                      </td>
                      <td class="p-3.5 text-right font-mono text-slate-300">
                        \${{ Number(c.total_factura).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-right font-mono font-bold" [class.text-emerald-400]="Number(c.saldo_pendiente) > 0">
                        \${{ Number(c.saldo_pendiente).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                      <td class="p-3.5 text-center">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
                          [class]="c.estado === 'COBRADA_TOTAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (c.estado === 'COBRADA_PARCIAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')">
                          {{ c.estado }}
                        </span>
                      </td>
                      <td class="p-3.5 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          @if (Number(c.saldo_pendiente) > 0.01 && c.estado !== 'ANULADA') {
                            <button
                              type="button"
                              (click)="abrirModalRecaudo(c)"
                              class="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                              title="Registrar Recibo de Caja (ING)"
                            >
                              <span>💵</span>
                              <span>Recaudar</span>
                            </button>
                          }
                          <button
                            type="button"
                            (click)="abrirHistorialRecaudos(c)"
                            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                            title="Historial de Abonos"
                          >
                            Recibos
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <app-table-pagination
            [totalItems]="carteraFiltrada().length"
            [pageSize]="10"
            (pageChange)="paginaActual.set($event)"
          />
        </div>
      }

      <!-- PESTAÑA 2: ESTADO DE CUENTA POR CLIENTE -->
      @if (pestanaActiva() === 'ESTADO_CUENTA') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-base font-bold text-white">Estado de Cuenta por Cliente</h2>
              <p class="text-xs text-slate-400">Resumen consolidado y facturas abiertas para conciliación y cobro.</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="modalClienteLookupVisible.set(true)"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🔍</span>
                <span>Seleccionar Cliente</span>
              </button>
              @if (estadoCuentaData()) {
                <button
                  type="button"
                  (click)="imprimirEstadoCuenta()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Imprimir</span>
                </button>
              }
            </div>
          </div>

          @if (estadoCuentaData(); as ec) {
            <!-- Tarjeta Cliente -->
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div class="md:col-span-2">
                <span class="text-slate-400">Cliente:</span>
                <div class="text-base font-black text-white">{{ ec.cliente?.razon_social || ec.cliente?.nombre_completo }}</div>
                <div class="text-slate-400 font-mono">NIT: {{ ec.cliente?.numero_identificacion }} | Tel: {{ ec.cliente?.telefono || 'N/A' }}</div>
              </div>
              <div>
                <span class="text-slate-400">Total Saldo Cartera:</span>
                <div class="text-lg font-mono font-bold text-emerald-400">\${{ Number(ec.total_saldo).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</div>
              </div>
              <div>
                <span class="text-slate-400">Total en Mora:</span>
                <div class="text-lg font-mono font-bold text-rose-400">\${{ Number(ec.total_vencido).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</div>
              </div>
            </div>

            <!-- Tabla de Facturas del Cliente -->
            <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th class="p-3">Factura</th>
                    <th class="p-3">Emisión</th>
                    <th class="p-3">Vencimiento</th>
                    <th class="p-3 text-center">Días Mora</th>
                    <th class="p-3 text-right">Total</th>
                    <th class="p-3 text-right">Saldo Pendiente</th>
                    <th class="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @for (f of ec.facturas || []; track f.id) {
                    <tr>
                      <td class="p-3 font-mono font-bold text-indigo-400">{{ f.numero_factura }}</td>
                      <td class="p-3 text-slate-300">{{ f.fecha_emision }}</td>
                      <td class="p-3 text-slate-300">{{ f.fecha_vencimiento }}</td>
                      <td class="p-3 text-center font-mono" [class.text-rose-400]="f.dias_mora > 0">
                        {{ f.dias_mora > 0 ? f.dias_mora + ' días' : 'Al día' }}
                      </td>
                      <td class="p-3 text-right font-mono text-slate-300">\${{ Number(f.total_factura).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                      <td class="p-3 text-right font-mono font-bold text-emerald-400">\${{ Number(f.saldo_pendiente).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                      <td class="p-3 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [class]="f.estado === 'COBRADA_TOTAL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'">
                          {{ f.estado }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center text-slate-500">
              Selecciona un cliente para generar su estado de cuenta oficial.
            </div>
          }
        </div>
      }

      <!-- PESTAÑA 3: EXTRACTO CRONOLÓGICO -->
      @if (pestanaActiva() === 'EXTRACTO') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-base font-bold text-white">Extracto Cronológico de Cartera</h2>
              <p class="text-xs text-slate-400">Movimientos ordenados cronológicamente: Facturación (Cargos) vs Recaudos (Abonos).</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="modalClienteLookupVisible.set(true)"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🔍</span>
                <span>Seleccionar Cliente</span>
              </button>
            </div>
          </div>

          @if (extractoData(); as ex) {
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <div class="text-base font-bold text-white">{{ ex.cliente?.razon_social || ex.cliente?.nombre_completo }}</div>
                <div class="text-slate-400 font-mono">NIT: {{ ex.cliente?.numero_identificacion }}</div>
              </div>
              <div class="text-right">
                <span class="text-slate-400">Saldo Final Acumulado:</span>
                <div class="text-xl font-mono font-black text-emerald-400">\${{ Number(ex.saldo_actual).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</div>
              </div>
            </div>

            <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th class="p-3">Fecha</th>
                    <th class="p-3">Documento</th>
                    <th class="p-3">Concepto / Glosa</th>
                    <th class="p-3 text-right">Cargo (+)</th>
                    <th class="p-3 text-right">Abono (-)</th>
                    <th class="p-3 text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @for (m of ex.movimientos || []; track m.documento + m.fecha) {
                    <tr>
                      <td class="p-3 text-slate-300">{{ m.fecha }}</td>
                      <td class="p-3 font-mono font-bold" [class.text-indigo-400]="m.tipo === 'CARGO'" [class.text-emerald-400]="m.tipo === 'ABONO'">
                        {{ m.documento }}
                      </td>
                      <td class="p-3 text-slate-300">{{ m.glosa }}</td>
                      <td class="p-3 text-right font-mono text-slate-200">
                        {{ m.debito > 0 ? '\$' + Number(m.debito).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '-' }}
                      </td>
                      <td class="p-3 text-right font-mono text-emerald-400">
                        {{ m.credito > 0 ? '\$' + Number(m.credito).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '-' }}
                      </td>
                      <td class="p-3 text-right font-mono font-bold text-white">
                        \${{ Number(m.saldo).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center text-slate-500">
              Selecciona un cliente para visualizar su extracto cronológico.
            </div>
          }
        </div>
      }

      <!-- PESTAÑA 4: MATRIZ DE EDADES -->
      @if (pestanaActiva() === 'EDADES') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-base font-bold text-white">Matriz de Antigüedad de Cartera por Edades (NIIF 9)</h2>
              <p class="text-xs text-slate-400">Distribución de saldos vencidos en franjas de 30 días para análisis de riesgo crediticio.</p>
            </div>
            <button
              type="button"
              (click)="imprimirMatriz()"
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Imprimir Matriz</span>
            </button>
          </div>

          <!-- Totales en Franjas Horizontales -->
          @if (matrizEdadesData(); as md) {
            <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-[10px] text-emerald-400 font-bold uppercase">Corriente</span>
                <div class="text-sm font-bold font-mono text-white mt-1">\${{ Number(md.totales.corriente).toLocaleString('es-CO') }}</div>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-[10px] text-amber-400 font-bold uppercase">1 - 30 Días</span>
                <div class="text-sm font-bold font-mono text-white mt-1">\${{ Number(md.totales.dias_1_30).toLocaleString('es-CO') }}</div>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-[10px] text-amber-500 font-bold uppercase">31 - 60 Días</span>
                <div class="text-sm font-bold font-mono text-white mt-1">\${{ Number(md.totales.dias_31_60).toLocaleString('es-CO') }}</div>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-[10px] text-orange-400 font-bold uppercase">61 - 90 Días</span>
                <div class="text-sm font-bold font-mono text-white mt-1">\${{ Number(md.totales.dias_61_90).toLocaleString('es-CO') }}</div>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-[10px] text-rose-400 font-bold uppercase">+90 Días</span>
                <div class="text-sm font-bold font-mono text-white mt-1">\${{ Number(md.totales.mas_90).toLocaleString('es-CO') }}</div>
              </div>
              <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-[10px] text-indigo-400 font-bold uppercase">Total Cartera</span>
                <div class="text-sm font-bold font-mono text-emerald-400 mt-1">\${{ Number(md.totales.total).toLocaleString('es-CO') }}</div>
              </div>
            </div>

            <!-- Tabla por Clientes -->
            <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table class="w-full text-left border-collapse text-xs font-mono">
                <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th class="p-3 font-sans">Cliente</th>
                    <th class="p-3 text-right">Corriente</th>
                    <th class="p-3 text-right">1-30 Días</th>
                    <th class="p-3 text-right">31-60 Días</th>
                    <th class="p-3 text-right">61-90 Días</th>
                    <th class="p-3 text-right">+90 Días</th>
                    <th class="p-3 text-right font-bold text-white">Total Saldo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @for (c of md.clientes || []; track c.cliente_id) {
                    <tr>
                      <td class="p-3 font-semibold text-white">
                        {{ c.razon_social }}
                        <div class="text-[10px] text-slate-500 font-mono">NIT: {{ c.nit }}</div>
                      </td>
                      <td class="p-3 text-right font-mono text-slate-300">\${{ Number(c.corriente).toLocaleString('es-CO') }}</td>
                      <td class="p-3 text-right font-mono text-amber-400">\${{ Number(c.dias_1_30).toLocaleString('es-CO') }}</td>
                      <td class="p-3 text-right font-mono text-amber-500">\${{ Number(c.dias_31_60).toLocaleString('es-CO') }}</td>
                      <td class="p-3 text-right font-mono text-orange-400">\${{ Number(c.dias_61_90).toLocaleString('es-CO') }}</td>
                      <td class="p-3 text-right font-mono text-rose-400 font-bold">\${{ Number(c.mas_90).toLocaleString('es-CO') }}</td>
                      <td class="p-3 text-right font-mono font-black text-emerald-400">\${{ Number(c.total).toLocaleString('es-CO') }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>

    <!-- MODAL DE REGISTRAR RECAUDO (RECIBO DE CAJA ING) -->
    @if (modalRecaudoVisible() && cxcSeleccionada()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
          <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>💵</span>
              <span>Registrar Recibo de Caja (ING)</span>
            </h3>
            <button
              type="button"
              (click)="modalRecaudoVisible.set(false)"
              class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Factura:</span>
              <span class="font-bold text-indigo-400 font-mono">{{ cxcSeleccionada()?.numero_factura }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Cliente:</span>
              <span class="font-semibold text-white">{{ cxcSeleccionada()?.tercero?.razon_social }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Saldo Pendiente:</span>
              <span class="font-mono font-bold text-emerald-400">\${{ Number(cxcSeleccionada()?.saldo_pendiente || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>

          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Monto a Recaudar *</label>
              <input
                type="number"
                min="0.01"
                [max]="cxcSeleccionada()?.saldo_pendiente || 0"
                [(ngModel)]="montoRecaudo"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- Selector de Cuenta de Banco/Caja (PUC Lookup) -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Cuenta de Entrada (Caja / Banco) *</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 truncate font-mono">
                  @if (cuentaBancoSeleccionada()) {
                    <span class="text-emerald-400 font-bold">[{{ cuentaBancoSeleccionada()?.codigo }}]</span>
                    <span class="ml-1 text-white">{{ cuentaBancoSeleccionada()?.nombre }}</span>
                  } @else {
                    <span class="text-slate-500 italic">Seleccionar cuenta...</span>
                  }
                </div>
                <button
                  type="button"
                  (click)="modalPucLookupVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
                >
                  🔍 Buscar
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-300">Fecha de Recaudo</label>
                <input
                  type="date"
                  [(ngModel)]="fechaRecaudo"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-slate-300">Método de Pago</label>
                <select
                  [(ngModel)]="metodoRecaudo"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="CONSIGNACION">Consignación</option>
                  <option value="PASARELA_PAGO">Pasarela</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-300">Referencia de Transacción / Comprobante</label>
              <input
                type="text"
                [(ngModel)]="referenciaTransaccion"
                placeholder="Ej: Aprobación #847291"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              (click)="modalRecaudoVisible.set(false)"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardarRecaudo()"
              [disabled]="guardandoRecaudo() || montoRecaudo <= 0 || !cuentaBancoSeleccionada()"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-40"
            >
              ✓ Registrar y Contabilizar ING
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL DE HISTORIAL DE RECAUDOS POR FACTURA -->
    @if (modalHistorialRecaudosVisible() && cxcSeleccionada()) {
      <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
          <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 class="text-sm font-bold text-white font-mono">
              Recibos de Caja • Factura {{ cxcSeleccionada()?.numero_factura }}
            </h3>
            <button
              type="button"
              (click)="modalHistorialRecaudosVisible.set(false)"
              class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          <div class="overflow-x-auto border border-slate-800/80 rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold">
                <tr>
                  <th class="p-2.5">Fecha</th>
                  <th class="p-2.5">Comprobante</th>
                  <th class="p-2.5">Cuenta Destino</th>
                  <th class="p-2.5 text-right">Valor Recaudado</th>
                  <th class="p-2.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-sans">
                @if (recaudosFactura().length === 0) {
                  <tr>
                    <td colspan="5" class="p-6 text-center text-slate-500">
                      No se han registrado abonos o recaudos a esta factura.
                    </td>
                  </tr>
                } @else {
                  @for (r of recaudosFactura(); track r.id) {
                    <tr>
                      <td class="p-2.5 text-slate-300">{{ r.fecha_recaudo }}</td>
                      <td class="p-2.5 font-mono text-indigo-400">{{ r.referencia_transaccion || 'ING-AUTO' }}</td>
                      <td class="p-2.5 text-slate-300 font-mono">{{ r.cuenta_banco?.codigo }} - {{ r.cuenta_banco?.nombre }}</td>
                      <td class="p-2.5 text-right font-mono font-bold text-emerald-400">\${{ Number(r.monto_recaudo).toLocaleString('es-CO', { minimumFractionDigits: 2 }) }}</td>
                      <td class="p-2.5 text-center">
                        <button
                          type="button"
                          (click)="anularRecaudo(r)"
                          class="text-red-400 hover:text-red-300 text-xs font-bold"
                          title="Anular recibo de caja"
                        >
                          ✕ Anular
                        </button>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }

    <!-- LOOKUPS -->
    <app-tercero-lookup-modal
      [(visible)]="modalClienteLookupVisible"
      titulo="Seleccionar Cliente para Reporte de Cartera"
      [terceros]="clientesDisponibles()"
      (seleccionado)="onClienteSeleccionadoParaReporte($event)"
    />

    <app-puc-lookup-modal
      [(visible)]="modalPucLookupVisible"
      titulo="Seleccionar Cuenta de Caja o Banco para el Recaudo"
      [cuentas]="cuentasDisponibles()"
      (cuentaSeleccionada)="onCuentaBancoSeleccionada($event)"
    />
  `,
})
export class CxcAdminComponent implements OnInit {
  private readonly cxcService = inject(CxcService);
  private readonly http = inject(HttpClient);
  public readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly Number = Number;

  pestanaActiva = signal<'CARTERA' | 'ESTADO_CUENTA' | 'EXTRACTO' | 'EDADES'>('CARTERA');
  cartera = signal<CuentaPorCobrarItem[]>([]);
  resumenCartera = signal<{ totalCartera: number; totalCorriente: number; totalVencido: number }>({
    totalCartera: 0,
    totalCorriente: 0,
    totalVencido: 0,
  });
  cargando = signal<boolean>(false);
  busquedaTexto = '';
  filtroEstado = 'TODOS';
  carteraFiltrada = signal<CuentaPorCobrarItem[]>([]);
  paginaActual = signal<number>(1);

  // Recaudos
  cxcSeleccionada = signal<CuentaPorCobrarItem | null>(null);
  modalRecaudoVisible = signal<boolean>(false);
  modalHistorialRecaudosVisible = signal<boolean>(false);
  recaudosFactura = signal<RecaudoCxcItem[]>([]);
  montoRecaudo = 0;
  fechaRecaudo = new Date().toISOString().split('T')[0];
  metodoRecaudo = 'TRANSFERENCIA';
  referenciaTransaccion = '';
  cuentaBancoSeleccionada = signal<CuentaPucLookupItem | null>(null);
  guardandoRecaudo = signal<boolean>(false);

  // Reportes
  clienteParaReporte = signal<TerceroItem | null>(null);
  estadoCuentaData = signal<any | null>(null);
  extractoData = signal<any | null>(null);
  matrizEdadesData = signal<any | null>(null);

  // Modales
  modalClienteLookupVisible = signal<boolean>(false);
  modalPucLookupVisible = signal<boolean>(false);

  // Catálogos
  clientesDisponibles = signal<TerceroItem[]>([]);
  cuentasDisponibles = signal<CuentaPucLookupItem[]>([]);

  readonly carteraPaginada = computed(() => {
    const list = this.carteraFiltrada();
    const page = this.paginaActual();
    const size = 10;
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  ngOnInit(): void {
    this.cargarCartera();
    this.cargarCatalogos();
  }

  cambiarPestana(pestana: 'CARTERA' | 'ESTADO_CUENTA' | 'EXTRACTO' | 'EDADES'): void {
    this.pestanaActiva.set(pestana);
    if (pestana === 'CARTERA') {
      this.cargarCartera();
    } else if (pestana === 'EDADES') {
      this.cargarMatrizEdades();
    }
  }

  cargarCartera(): void {
    this.cargando.set(true);
    this.cxcService.listarCartera('', this.filtroEstado).subscribe({
      next: (res) => {
        this.cartera.set(res.items || []);
        this.resumenCartera.set(res.resumen);
        this.filtrarCartera();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  filtrarCartera(): void {
    const q = this.busquedaTexto.toLowerCase().trim();
    if (!q) {
      this.carteraFiltrada.set(this.cartera());
      return;
    }
    const filtrados = this.cartera().filter((c) => {
      return (
        c.numero_factura.toLowerCase().includes(q) ||
        (c.tercero?.razon_social && c.tercero.razon_social.toLowerCase().includes(q)) ||
        (c.tercero?.numero_identificacion && c.tercero.numero_identificacion.toLowerCase().includes(q))
      );
    });
    this.carteraFiltrada.set(filtrados);
    this.paginaActual.set(1);
  }

  cargarCatalogos(): void {
    const emp = this.authService.empresaActiva();
    if (emp) {
      this.http.get<TerceroItem[]>(`http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`).subscribe({
        next: (t) => this.clientesDisponibles.set(t || []),
      });
      this.http.get<CuentaPucLookupItem[]>(`http://localhost:3000/api/v1/puc?empresa_id=${emp.empresa_id}`).subscribe({
        next: (c) => this.cuentasDisponibles.set(c || []),
      });
    }
  }

  esVencida(fechaVenc: string, saldo: number): boolean {
    const hoy = new Date().toISOString().split('T')[0];
    return fechaVenc < hoy && Number(saldo) > 0.01;
  }

  abrirModalRecaudo(cxc: CuentaPorCobrarItem): void {
    this.cxcSeleccionada.set(cxc);
    this.montoRecaudo = Number(cxc.saldo_pendiente);
    this.fechaRecaudo = new Date().toISOString().split('T')[0];
    this.referenciaTransaccion = `REC-${cxc.numero_factura}`;
    this.modalRecaudoVisible.set(true);
  }

  onCuentaBancoSeleccionada(cuenta: CuentaPucLookupItem): void {
    this.cuentaBancoSeleccionada.set(cuenta);
  }

  guardarRecaudo(): void {
    const cxc = this.cxcSeleccionada();
    const banco = this.cuentaBancoSeleccionada();
    if (!cxc || !banco) return;

    const payload = {
      cuenta_por_cobrar_id: cxc.id,
      cuenta_banco_id: banco.id,
      monto_recaudo: Number(this.montoRecaudo),
      fecha_recaudo: this.fechaRecaudo,
      metodo_recaudo: this.metodoRecaudo,
      referencia_transaccion: this.referenciaTransaccion,
      glosa: `Recaudo factura ${cxc.numero_factura}`,
    };

    this.guardandoRecaudo.set(true);
    this.cxcService.registrarRecaudo(payload).subscribe({
      next: () => {
        this.guardandoRecaudo.set(false);
        this.notification.success('Recibo de Caja Registrado', 'El abono se ha procesado y contabilizado exitosamente.');
        this.modalRecaudoVisible.set(false);
        this.cargarCartera();
      },
      error: (err) => {
        this.guardandoRecaudo.set(false);
        this.notification.error('Error al registrar recaudo', err.error?.message || 'Error inesperado');
      },
    });
  }

  abrirHistorialRecaudos(cxc: CuentaPorCobrarItem): void {
    this.cxcSeleccionada.set(cxc);
    this.cxcService.listarRecaudosPorFactura(cxc.id).subscribe({
      next: (recaudos) => {
        this.recaudosFactura.set(recaudos || []);
        this.modalHistorialRecaudosVisible.set(true);
      },
    });
  }

  anularRecaudo(r: RecaudoCxcItem): void {
    this.cxcService.anularRecaudo(r.id, 'Anulación solicitada por usuario').subscribe({
      next: () => {
        this.notification.success('Recaudo Anulado', 'El recibo ha sido anulado y el saldo reintegrado a la cartera.');
        if (this.cxcSeleccionada()) {
          this.abrirHistorialRecaudos(this.cxcSeleccionada()!);
        }
        this.cargarCartera();
      },
      error: (err) => {
        this.notification.error('Error al anular recaudo', err.error?.message || 'No se pudo anular.');
      },
    });
  }

  onClienteSeleccionadoParaReporte(cliente: TerceroItem): void {
    this.clienteParaReporte.set(cliente);
    if (this.pestanaActiva() === 'ESTADO_CUENTA') {
      this.cxcService.obtenerEstadoCuenta(cliente.id).subscribe({
        next: (data) => this.estadoCuentaData.set(data),
      });
    } else if (this.pestanaActiva() === 'EXTRACTO') {
      this.cxcService.obtenerExtracto(cliente.id).subscribe({
        next: (data) => this.extractoData.set(data),
      });
    }
  }

  cargarMatrizEdades(): void {
    this.cxcService.obtenerMatrizEdades().subscribe({
      next: (data) => this.matrizEdadesData.set(data),
    });
  }

  imprimirEstadoCuenta(): void {
    window.print();
  }

  imprimirMatriz(): void {
    window.print();
  }
}
