import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  TesoreriaService,
  CajaMenorItem,
  GastoCajaMenorItem,
  ArqueoCajaMenorItem,
  CuentaBancariaItem,
  ExtractoBancarioItem,
  ConciliacionBancariaItem,
} from '../../../core/services/tesoreria.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { PucLookupModalComponent, CuentaPucLookupItem } from '../../../shared/components/puc-lookup-modal.component';
import { TerceroLookupModalComponent, TerceroItem } from '../../../shared/components/tercero-lookup-modal.component';

@Component({
  selector: 'app-tesoreria-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PucLookupModalComponent,
    TerceroLookupModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- HEADER PRINCIPAL -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div class="flex items-center gap-3">
            <span class="text-3xl">🏦</span>
            <div>
              <h1 class="text-2xl font-black text-white tracking-tight">Tesorería, Cajas Menores & Bancos</h1>
              <p class="text-sm text-slate-400">Control de fondos fijos, libro auxiliar de bancos (1110) y motor de conciliación bancaria NIIF (NIC 7)</p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="cambiarPestana('cajas')"
            [class]="pestanaActiva() === 'cajas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
            <span>💵</span> Cajas Menores
          </button>
          <button
            (click)="cambiarPestana('bancos')"
            [class]="pestanaActiva() === 'bancos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
            <span>🏛️</span> Cuentas Bancarias
          </button>
          <button
            (click)="cambiarPestana('conciliacion')"
            [class]="pestanaActiva() === 'conciliacion' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
            <span>⚖️</span> Conciliación Bancaria
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- PESTAÑA 1: CAJAS MENORES -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'cajas') {
        <!-- Tarjetas de Resumen Cajas Menores -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fondos Fijos Autorizados</span>
            <div class="text-2xl font-black text-white mt-1">\${{ totalFondoFijo() | number:'1.2-2' }}</div>
            <p class="text-xs text-indigo-400 mt-1">Cuentas 110510 asignadas</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Efectivo Físico Disponible</span>
            <div class="text-2xl font-black text-emerald-400 mt-1">\${{ totalEfectivoDisponible() | number:'1.2-2' }}</div>
            <p class="text-xs text-slate-400 mt-1">Disponible para desembolsos menores</p>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vales Legalizados Pendientes</span>
            <div class="text-2xl font-black text-amber-400 mt-1">\${{ totalValesPendientes() | number:'1.2-2' }}</div>
            <p class="text-xs text-slate-400 mt-1">Listos para reintegro vía egreso bancario</p>
          </div>
        </div>

        <!-- Tabla de Cajas Menores -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>💵</span> Catálogo de Cajas Menores
            </h2>
            <button
              (click)="abrirModalCrearCaja()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
              <span>+</span> Crear Caja Menor
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th class="p-4">Código / Nombre</th>
                  <th class="p-4">Responsable (Custodio)</th>
                  <th class="p-4">Cuenta PUC</th>
                  <th class="p-4 text-right">Fondo Fijo</th>
                  <th class="p-4 text-right">Efectivo Disp.</th>
                  <th class="p-4 text-right">En Vales</th>
                  <th class="p-4 text-center">Estado</th>
                  <th class="p-4 text-center">Acciones Operativas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                @for (caja of cajas(); track caja.id) {
                  <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="p-4">
                      <div class="font-bold text-white">{{ caja.codigo }}</div>
                      <div class="text-xs text-slate-400">{{ caja.nombre }}</div>
                    </td>
                    <td class="p-4">
                      <div class="font-medium text-slate-200">{{ caja.responsable?.nombre_completo || 'Sin asignar' }}</div>
                      <div class="text-xs text-slate-500">NIT: {{ caja.responsable?.numero_identificacion || 'N/A' }}</div>
                    </td>
                    <td class="p-4">
                      <span class="px-2.5 py-1 bg-slate-800 text-indigo-300 rounded-lg text-xs font-mono font-semibold">
                        {{ caja.cuenta_puc?.codigo || '110510' }}
                      </span>
                    </td>
                    <td class="p-4 text-right font-bold text-white">\${{ Number(caja.monto_fondo_fijo) | number:'1.2-2' }}</td>
                    <td class="p-4 text-right font-bold text-emerald-400">\${{ Number(caja.saldo_actual_efectivo) | number:'1.2-2' }}</td>
                    <td class="p-4 text-right font-bold text-amber-400">\${{ Number(caja.saldo_en_vales) | number:'1.2-2' }}</td>
                    <td class="p-4 text-center">
                      <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                        [class]="caja.estado === 'ABIERTA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-300'">
                        {{ caja.estado }}
                      </span>
                    </td>
                    <td class="p-4 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          (click)="abrirModalGasto(caja)"
                          title="Registrar Vale de Gasto Menor"
                          class="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all">
                          + Vale
                        </button>
                        <button
                          (click)="abrirModalArqueo(caja)"
                          title="Realizar Arqueo Físico de Caja"
                          class="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all">
                          ⚖️ Arqueo
                        </button>
                        <button
                          (click)="abrirModalReembolso(caja)"
                          title="Reembolsar Caja Menor vía Egreso Bancario"
                          class="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all">
                          🔄 Reembolso
                        </button>
                        <button
                          (click)="verGastosCaja(caja)"
                          title="Historial de Gastos y Vales"
                          class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all">
                          📜 Vales
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="p-8 text-center text-slate-500">
                      No hay cajas menores registradas. Haga clic en "+ Crear Caja Menor" para constituir un fondo fijo.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 2: CUENTAS BANCARIAS & LIBRO AUXILIAR -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'bancos') {
        <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>🏛️</span> Cuentas Bancarias Registradas (PUC 1110)
              </h2>
              <p class="text-xs text-slate-400">Cuentas corrientes y de ahorros conectadas al core ledger NIIF</p>
            </div>
            <button
              (click)="abrirModalCrearCuenta()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
              <span>+</span> Registrar Cuenta Bancaria
            </button>
          </div>

          <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (cta of cuentasBancarias(); track cta.id) {
              <div class="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl hover:border-indigo-500/50 transition-all shadow-md">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider text-indigo-400">{{ cta.tipo_cuenta }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold" [class]="cta.activa ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'">
                    {{ cta.activa ? 'ACTIVA' : 'INACTIVA' }}
                  </span>
                </div>
                <div class="text-xl font-black text-white mt-2">{{ cta.banco_nombre }}</div>
                <div class="font-mono text-sm text-slate-300 mt-1">No. {{ cta.numero_cuenta }}</div>
                <div class="text-xs text-slate-400 mt-2 flex items-center gap-2">
                  <span>PUC:</span>
                  <span class="font-mono text-indigo-300 font-semibold">{{ cta.cuenta_puc?.codigo || '1110' }} - {{ cta.cuenta_puc?.nombre }}</span>
                </div>

                <div class="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <button
                    (click)="abrirLibroAuxiliar(cta)"
                    class="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <span>📖</span> Ver Libro Auxiliar Contable
                  </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-3 p-8 text-center text-slate-500">
                No hay cuentas bancarias configuradas. Registre su primera cuenta bancaria para conciliar extractos.
              </div>
            }
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 3: CONCILIACIÓN BANCARIA A DOBLE COLUMNA -->
      <!-- ========================================================================= -->
      @if (pestanaActiva() === 'conciliacion') {
        <!-- Barra de Filtros y Acciones de Conciliación -->
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Cuenta Bancaria</label>
              <select
                [ngModel]="cuentaSeleccionadaId()"
                (ngModelChange)="cuentaSeleccionadaId.set($event)"
                class="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                @for (c of cuentasBancarias(); track c.id) {
                  <option [value]="c.id">{{ c.banco_nombre }} - {{ c.numero_cuenta }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Año</label>
              <input
                type="number"
                [ngModel]="periodoAnio()"
                (ngModelChange)="periodoAnio.set($event)"
                class="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm w-24 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Mes</label>
              <select
                [ngModel]="periodoMes()"
                (ngModelChange)="periodoMes.set(Number($event))"
                class="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option [value]="1">Enero</option>
                <option [value]="2">Febrero</option>
                <option [value]="3">Marzo</option>
                <option [value]="4">Abril</option>
                <option [value]="5">Mayo</option>
                <option [value]="6">Junio</option>
                <option [value]="7">Julio</option>
                <option [value]="8">Agosto</option>
                <option [value]="9">Septiembre</option>
                <option [value]="10">Octubre</option>
                <option [value]="11">Noviembre</option>
                <option [value]="12">Diciembre</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="abrirModalImportarExtracto()"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
              <span>📥</span> Importar Extracto
            </button>
            <button
              (click)="ejecutarConciliacion()"
              [disabled]="cargando()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
              <span>⚡</span> Ejecutar Conciliación
            </button>
          </div>
        </div>

        @if (conciliacionActual(); as conc) {
          <!-- Hoja Oficial de Conciliación a Doble Columna -->
          <div id="seccion-impresion-conciliacion" class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
            <!-- Encabezado Membretado Oficial -->
            <div class="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span class="text-xs font-mono text-indigo-400 font-bold">HOJA OFICIAL DE CONCILIACIÓN BANCARIA</span>
                <h3 class="text-2xl font-black text-white mt-1">{{ conc.cuenta_bancaria?.banco_nombre }} - {{ conc.cuenta_bancaria?.numero_cuenta }}</h3>
                <p class="text-xs text-slate-400">Período Fiscal: {{ conc.periodo_mes }}/{{ conc.periodo_anio }} | Consecutivo: {{ conc.consecutivo }}</p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  (click)="imprimirConciliacion()"
                  class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                  <span>🖨️</span> Imprimir Conciliación
                </button>
                @if (conc.estado === 'EN_PROCESO' && conc.diferencia_descuadre <= 0.05) {
                  <button
                    (click)="aprobarConciliacion(conc.id)"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2">
                    <span>✅</span> Aprobar Conciliación
                  </button>
                }
              </div>
            </div>

            <!-- Banner de Estatus de Cuadre -->
            <div class="p-4 rounded-xl flex items-center justify-between"
              [class]="conc.diferencia_descuadre <= 0.05 ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ conc.diferencia_descuadre <= 0.05 ? '⚖️' : '⚠️' }}</span>
                <div>
                  <div class="font-bold text-sm">
                    {{ conc.diferencia_descuadre <= 0.05 ? 'CONCILIACIÓN MATEMÁTICAMENTE CUADRADA AL CENTAVO' : 'CONCILIACIÓN CON DESCUADRE PENDIENTE DE REVISIÓN' }}
                  </div>
                  <div class="text-xs opacity-80">
                    {{ conc.diferencia_descuadre <= 0.05 ? 'Saldos ajustados coinciden con tolerancia cero bajo NIIF' : 'Revise notas de extracto sin causar o partidas en tránsito' }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs opacity-75">Diferencia Neta:</span>
                <div class="text-xl font-mono font-black">\${{ Number(conc.diferencia_descuadre) | number:'1.2-2' }}</div>
              </div>
            </div>

            <!-- Matriz a Doble Columna NIIF -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- COLUMNA 1: EXTRACTO BANCARIO -->
              <div class="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h4 class="font-bold text-white text-sm flex items-center gap-2">
                    <span>🏦</span> Saldo en Extracto Bancario
                  </h4>
                  <span class="font-mono font-bold text-indigo-300">\${{ Number(conc.saldo_extracto_bancario) | number:'1.2-2' }}</span>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between text-slate-300">
                    <span>(+) Consignaciones en tránsito:</span>
                    <span class="font-mono font-bold text-emerald-400">\${{ Number(conc.total_consignaciones_en_transito) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center justify-between text-slate-300">
                    <span>(-) Cheques girados y no cobrados:</span>
                    <span class="font-mono font-bold text-rose-400">-\${{ Number(conc.total_cheques_en_transito) | number:'1.2-2' }}</span>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-700/60 flex items-center justify-between font-bold text-sm">
                  <span class="text-white">(=) Saldo Conciliado de Bancos:</span>
                  <span class="font-mono text-emerald-400 font-black">\${{ Number(conc.saldo_conciliado_extracto) | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- COLUMNA 2: LIBROS CONTABLES -->
              <div class="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h4 class="font-bold text-white text-sm flex items-center gap-2">
                    <span>📚</span> Saldo en Libros Contables (1110)
                  </h4>
                  <span class="font-mono font-bold text-indigo-300">\${{ Number(conc.saldo_libros_contables) | number:'1.2-2' }}</span>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between text-slate-300">
                    <span>(+) Notas Crédito (abonos en extracto):</span>
                    <span class="font-mono font-bold text-emerald-400">\${{ Number(conc.total_notas_credito_pendientes) | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center justify-between text-slate-300">
                    <span>(-) Notas Débito (GMF 4x1000, comisiones):</span>
                    <span class="font-mono font-bold text-rose-400">-\${{ Number(conc.total_notas_debito_pendientes) | number:'1.2-2' }}</span>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-700/60 flex items-center justify-between font-bold text-sm">
                  <span class="text-white">(=) Saldo Conciliado de Libros:</span>
                  <span class="font-mono text-emerald-400 font-black">\${{ Number(conc.saldo_conciliado_libros) | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Desglose de Partidas Conciliatorias & Causación en 1 Clic -->
            <div class="pt-4 border-t border-slate-800">
              <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span>📋</span> Partidas Conciliatorias Identificadas
              </h4>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-800 text-slate-400 uppercase tracking-wider">
                      <th class="p-3">Tipo de Partida</th>
                      <th class="p-3">Fecha</th>
                      <th class="p-3">Concepto / Descripción</th>
                      <th class="p-3">Referencia</th>
                      <th class="p-3 text-right">Valor</th>
                      <th class="p-3 text-center">Acción Rápida</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-300">
                    @for (p of conc.partidas; track p.id) {
                      <tr class="hover:bg-slate-800/40">
                        <td class="p-3 font-semibold">
                          <span class="px-2 py-0.5 rounded text-[10px]"
                            [class]="p.tipo_partida === 'MATCH_EXACTO' ? 'bg-emerald-500/10 text-emerald-400' : p.tipo_partida.includes('DEBITO') ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'">
                            {{ p.tipo_partida }}
                          </span>
                        </td>
                        <td class="p-3 font-mono">{{ p.fecha | date:'yyyy-MM-dd' }}</td>
                        <td class="p-3">{{ p.concepto }}</td>
                        <td class="p-3 font-mono text-slate-400">{{ p.referencia || '-' }}</td>
                        <td class="p-3 text-right font-mono font-bold text-white">\${{ Number(p.valor) | number:'1.2-2' }}</td>
                        <td class="p-3 text-center">
                          @if (p.tipo_partida === 'NOTA_DEBITO_PENDIENTE' && p.extracto_linea_id) {
                            <button
                              (click)="abrirModalCausarNota(p)"
                              class="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all">
                              ⚡ Causar en 1 Clic
                            </button>
                          } @else if (p.tipo_partida === 'MATCH_EXACTO') {
                            <span class="text-emerald-400 font-semibold">✓ Cruzado</span>
                          } @else {
                            <span class="text-slate-500">En tránsito</span>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="p-4 text-center text-slate-500">No hay partidas conciliatorias pendientes.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Espacios Formales de Firma Reglamentaria NIIF -->
            <div class="pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs text-slate-400">
              <div class="border-t border-slate-700 pt-2">
                <div class="font-bold text-white">{{ conc.elaborado_por }}</div>
                <div>Elaboró / Auxiliar Contable</div>
              </div>
              <div class="border-t border-slate-700 pt-2">
                <div class="font-bold text-white">{{ conc.revisado_por || 'Pendiente de Revisión' }}</div>
                <div>Revisó / Contador Público TP</div>
              </div>
              <div class="border-t border-slate-700 pt-2">
                <div class="font-bold text-white">{{ conc.aprobado_por || 'Pendiente de Aprobación' }}</div>
                <div>Aprobó / Revisor Fiscal</div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-slate-900 border border-slate-800 p-12 rounded-2xl shadow-xl text-center text-slate-500">
            <span class="text-4xl">⚖️</span>
            <h3 class="text-lg font-bold text-white mt-3">Sin Conciliación en Pantalla</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">Seleccione la cuenta bancaria, año y mes, y haga clic en "⚡ Ejecutar Conciliación" para contrastar el extracto oficial contra el libro auxiliar.</p>
          </div>
        }
      }
    </div>

    <!-- ========================================================================= -->
    <!-- MODALES DE CREACIÓN Y EDICIÓN -->
    <!-- ========================================================================= -->

    <!-- MODAL 1: CREAR CAJA MENOR -->
    @if (modalCrearCajaAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>💵</span> Nueva Caja Menor (Fondo Fijo 110510)
            </h3>
            <button (click)="modalCrearCajaAbierto.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <form [formGroup]="formCajaMenor" (ngSubmit)="guardarCajaMenor()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Código</label>
                <input formControlName="codigo" placeholder="Ej: CM-01" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Monto Fondo Fijo ($)</label>
                <input type="number" formControlName="monto_fondo_fijo" placeholder="1000000" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Nombre Descriptivo</label>
              <input formControlName="nombre" placeholder="Ej: Caja Menor Administración Central" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            <!-- Selector de Custodio Tercero con Modal Lookup -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Responsable / Custodio (Tercero)</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 truncate">
                  {{ responsableSeleccionado() ? responsableSeleccionado()?.nombre_completo + ' (' + responsableSeleccionado()?.numero_identificacion + ')' : 'Seleccione un tercero responsable...' }}
                </div>
                <button
                  type="button"
                  (click)="modalTerceroVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                  🔍 Buscar
                </button>
              </div>
            </div>

            <!-- Selector de Cuenta PUC de Caja Menor (110510) -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">
                1. Cuenta PUC de la Caja Menor (110510XX - Donde ingresa el efectivo)
              </label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 truncate font-mono">
                  @if (cuentaPucCajaSeleccionada()) {
                    <span class="text-emerald-400 font-bold">[{{ cuentaPucCajaSeleccionada()?.codigo }}]</span> {{ cuentaPucCajaSeleccionada()?.nombre }}
                  } @else {
                    <span class="text-slate-500 italic">Seleccione cuenta auxiliar de caja (ej. 11051001)...</span>
                  }
                </div>
                <button
                  type="button"
                  (click)="modalPucCajaVisible.set(true)"
                  class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
                  🔍 Buscar Cuenta Caja
                </button>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">
                Cuenta de activo donde se registrará el saldo en efectivo custodiado (Débito).
              </p>
            </div>

            <!-- Selector de Cuenta de Banco de Desembolso (1110) -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">
                2. Banco de Desembolso (1110XX - De donde sale el dinero)
              </label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 truncate font-mono">
                  @if (cuentaPucBancoDesembolsoSeleccionada()) {
                    <span class="text-indigo-400 font-bold">[{{ cuentaPucBancoDesembolsoSeleccionada()?.codigo }}]</span> {{ cuentaPucBancoDesembolsoSeleccionada()?.nombre }}
                  } @else {
                    <span class="text-slate-500 italic">Opcional: Sin comprobante de apertura inmediato...</span>
                  }
                </div>
                <button
                  type="button"
                  (click)="modalPucBancoDesembolsoVisible.set(true)"
                  class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
                  🔍 Buscar Banco
                </button>
                @if (cuentaPucBancoDesembolsoSeleccionada()) {
                  <button
                    type="button"
                    (click)="limpiarBancoDesembolso()"
                    title="Quitar cuenta de banco"
                    class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all">
                    ✕
                  </button>
                }
              </div>
              <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                @if (cuentaPucBancoDesembolsoSeleccionada()) {
                  <span class="text-emerald-400 font-semibold">⚡ Al guardar se generará automáticamente el Comprobante de Egreso (EGR) acreditando este banco.</span>
                } @else {
                  <span class="text-slate-500">Si seleccionas un banco se genera el comprobante de Egreso contable de inmediato. Si lo dejas vacío, solo se registra la caja.</span>
                }
              </p>
            </div>
            <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="modalCrearCajaAbierto.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancelar</button>
              <button type="submit" [disabled]="formCajaMenor.invalid || !responsableSeleccionado() || !cuentaPucCajaSeleccionada()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30">Guardar Fondo Fijo</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 2: REGISTRAR VALE DE GASTO -->
    @if (modalGastoAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🧾</span> Nuevo Vale de Gasto Menor — {{ cajaActiva()?.codigo }}
            </h3>
            <button (click)="modalGastoAbierto.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <form [formGroup]="formGasto" (ngSubmit)="guardarGasto()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Fecha del Gasto</label>
                <input type="date" formControlName="fecha_gasto" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Factura / Soporte Ref.</label>
                <input formControlName="soporte_factura_ref" placeholder="Ej: FE-992 o Tiquete POS" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Concepto del Gasto</label>
              <input formControlName="concepto" placeholder="Ej: Compra elementos de cafetería y aseo" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            </div>

            <!-- Proveedor Tercero -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Proveedor / Beneficiario del Desembolso</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 truncate">
                  {{ terceroGastoSeleccionado() ? (terceroGastoSeleccionado()?.razon_social || terceroGastoSeleccionado()?.nombre_completo) : 'Seleccione tercero proveedor...' }}
                </div>
                <button
                  type="button"
                  (click)="modalTerceroGastoVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                  🔍 Buscar
                </button>
              </div>
            </div>

            <!-- Cuenta PUC de Gasto (51/52) -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Cuenta PUC de Gasto (51 / 52)</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 truncate font-mono">
                  {{ cuentaPucGastoSeleccionada() ? cuentaPucGastoSeleccionada()?.codigo + ' - ' + cuentaPucGastoSeleccionada()?.nombre : 'Seleccione cuenta de gasto...' }}
                </div>
                <button
                  type="button"
                  (click)="modalPucGastoVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                  🔍 Buscar
                </button>
              </div>
            </div>

            <!-- Valores -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Subtotal ($)</label>
                <input type="number" formControlName="subtotal" (input)="recalcularTotalGasto()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">IVA ($)</label>
                <input type="number" formControlName="iva" (input)="recalcularTotalGasto()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">ReteFuente ($)</label>
                <input type="number" formControlName="retefuente" (input)="recalcularTotalGasto()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div class="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
              <span class="text-sm font-bold text-slate-300">Total a Desembolsar en Efectivo:</span>
              <span class="text-lg font-black font-mono text-emerald-400">\${{ formGasto.get('total')?.value || 0 | number:'1.2-2' }}</span>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="modalGastoAbierto.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancelar</button>
              <button type="submit" [disabled]="formGasto.invalid || !terceroGastoSeleccionado() || !cuentaPucGastoSeleccionada()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30">Registrar Vale</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 3: ARQUEO DE CAJA MENOR -->
    @if (modalArqueoAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>⚖️</span> Acta de Arqueo Físico — {{ cajaActiva()?.nombre }}
              </h3>
              <p class="text-xs text-slate-400">Conteo simultáneo de monedas, billetes y vales legalizados</p>
            </div>
            <button (click)="modalArqueoAbierto.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <!-- Desglose de Billetes -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Conteo de Billetes y Monedas</span>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-slate-400 mb-1">$100.000 (Cant)</label>
                  <input type="number" min="0" [(ngModel)]="conteoBilletes['100000']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">$50.000 (Cant)</label>
                  <input type="number" min="0" [(ngModel)]="conteoBilletes['50000']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">$20.000 (Cant)</label>
                  <input type="number" min="0" [(ngModel)]="conteoBilletes['20000']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">$10.000 (Cant)</label>
                  <input type="number" min="0" [(ngModel)]="conteoBilletes['10000']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">$5.000 (Cant)</label>
                  <input type="number" min="0" [(ngModel)]="conteoBilletes['5000']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">$2.000 (Cant)</label>
                  <input type="number" min="0" [(ngModel)]="conteoBilletes['2000']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-mono" />
                </div>
              </div>
              <div>
                <label class="block text-slate-400 text-xs mb-1">Total Monedas Sueltas ($)</label>
                <input type="number" min="0" [(ngModel)]="conteoBilletes['monedas']" (input)="recalcularArqueo()" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono" />
              </div>
            </div>

            <!-- Resumen Comparativo de Arqueo -->
            <div class="bg-slate-800/80 p-4 rounded-xl space-y-2 border border-slate-700">
              <div class="flex items-center justify-between text-xs text-slate-300">
                <span>(+) Total Efectivo Físico Contado:</span>
                <span class="font-mono font-bold text-white">\${{ arqueoTotalFisico() | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-300">
                <span>(+) Total Vales de Gasto Soportados:</span>
                <span class="font-mono font-bold text-amber-400">\${{ Number(cajaActiva()?.saldo_en_vales) | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between text-xs font-bold text-slate-200 pt-2 border-t border-slate-700">
                <span>(=) Total Fondo Contado:</span>
                <span class="font-mono text-indigo-300 font-black">\${{ arqueoTotalFondo() | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span>(-) Monto Fondo Fijo Autorizado:</span>
                <span class="font-mono font-bold">\${{ Number(cajaActiva()?.monto_fondo_fijo) | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-700"
                [class]="arqueoDiferencia() === 0 ? 'text-emerald-400' : arqueoDiferencia() > 0 ? 'text-blue-400' : 'text-rose-400'">
                <span>Resultado del Arqueo:</span>
                <span class="font-mono font-black">
                  {{ arqueoDiferencia() === 0 ? 'CUADRADO ($0.00)' : (arqueoDiferencia() > 0 ? 'SOBRANTE: +$' : 'FALTANTE: -$') + (Math.abs(arqueoDiferencia()) | number:'1.2-2') }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Observaciones del Auditor</label>
              <textarea [(ngModel)]="arqueoObservaciones" rows="2" placeholder="Notas sobre el estado físico de billetes, justificantes, etc." class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"></textarea>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button (click)="modalArqueoAbierto.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cerrar</button>
              <button (click)="guardarArqueo()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30">Sellar Acta de Arqueo</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: REEMBOLSO DE CAJA MENOR -->
    @if (modalReembolsoAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>🔄</span> Reembolso de Caja Menor — {{ cajaActiva()?.codigo }}
              </h3>
              <p class="text-xs text-slate-400">Emisión de Comprobante de Egreso (EGR) y causación definitiva al banco</p>
            </div>
            <button (click)="modalReembolsoAbierto.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Cuenta Bancaria de Pago (Egreso)</label>
              <select [(ngModel)]="cuentaBancoReembolsoId" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Seleccione cuenta bancaria de giro...</option>
                @for (cta of cuentasBancarias(); track cta.id) {
                  <option [value]="cta.cuenta_puc?.id">{{ cta.banco_nombre }} - {{ cta.numero_cuenta }} ({{ cta.cuenta_puc?.codigo }})</option>
                }
              </select>
            </div>

            <!-- Lista de Vales para Reembolsar con Selección -->
            <div>
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">Seleccione los vales a reponer:</span>
              <div class="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800 text-xs">
                @for (v of valesParaReembolso(); track v.id) {
                  <label class="p-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors">
                    <div class="flex items-center gap-3">
                      <input type="checkbox" [checked]="valesSeleccionadosIds().includes(v.id)" (change)="toggleSeleccionVale(v.id)" class="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                      <div>
                        <div class="font-bold text-white">{{ v.consecutivo }} - {{ v.concepto }}</div>
                        <div class="text-[11px] text-slate-400">{{ v.tercero?.razon_social || v.tercero?.nombre_completo }} | Ref: {{ v.soporte_factura_ref || 'S/R' }}</div>
                      </div>
                    </div>
                    <div class="font-mono font-bold text-emerald-400">\${{ Number(v.total) | number:'1.2-2' }}</div>
                  </label>
                } @empty {
                  <div class="p-6 text-center text-slate-500">No hay vales legalizados pendientes de reembolso.</div>
                }
              </div>
            </div>

            <div class="p-4 bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-700">
              <span class="text-sm font-bold text-slate-300">Total a Girar por Banco:</span>
              <span class="text-xl font-mono font-black text-emerald-400">\${{ totalReembolsoCalculado() | number:'1.2-2' }}</span>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button (click)="modalReembolsoAbierto.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancelar</button>
              <button
                (click)="ejecutarReembolso()"
                [disabled]="!cuentaBancoReembolsoId || valesSeleccionadosIds().length === 0"
                class="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30">
                Emitir Egreso y Reponer Fondo
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 5: IMPORTAR EXTRACTO BANCARIO -->
    @if (modalImportarExtractoAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>📥</span> Importar Extracto Bancario
            </h3>
            <button (click)="modalImportarExtractoAbierto.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <form [formGroup]="formExtracto" (ngSubmit)="guardarExtracto()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Año</label>
                <input type="number" formControlName="periodo_anio" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Mes</label>
                <select formControlName="periodo_mes" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                  <option [value]="1">Enero</option>
                  <option [value]="2">Febrero</option>
                  <option [value]="3">Marzo</option>
                  <option [value]="4">Abril</option>
                  <option [value]="5">Mayo</option>
                  <option [value]="6">Junio</option>
                  <option [value]="7">Julio</option>
                  <option [value]="8">Agosto</option>
                  <option [value]="9">Septiembre</option>
                  <option [value]="10">Octubre</option>
                  <option [value]="11">Noviembre</option>
                  <option [value]="12">Diciembre</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Saldo Inicial Extracto ($)</label>
                <input type="number" formControlName="saldo_inicial" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 mb-1">Saldo Final Extracto ($)</label>
                <input type="number" formControlName="saldo_final" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Pegar Movimientos (Formato: Fecha, Concepto, Referencia, Tipo[DEBITO/CREDITO], Valor)</label>
              <textarea
                [(ngModel)]="rawTextoExtracto"
                [ngModelOptions]="{ standalone: true }"
                rows="6"
                placeholder="2026-10-05, Consignacion en cheque, 44012, CREDITO, 1500000&#10;2026-10-15, Pago cheque ferreteria, 1023, DEBITO, 450000&#10;2026-10-31, Cobro GMF 4x1000, GMF-10, DEBITO, 6000"
                class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500"></textarea>
              <p class="text-[11px] text-slate-400 mt-1">Soporta copiar y pegar directamente desde Excel o CSV del banco.</p>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button type="button" (click)="modalImportarExtractoAbierto.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancelar</button>
              <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30">Cargar Extracto Oficial</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 6: CAUSACIÓN EN 1 CLIC DE NOTA BANCARIA -->
    @if (modalCausarNotaAbierto()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>⚡</span> Causar Nota Débito Bancaria en 1 Clic
            </h3>
            <button (click)="modalCausarNotaAbierto.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <div class="p-6 space-y-4 text-sm">
            <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1 text-xs">
              <div class="text-slate-400">Concepto en extracto: <span class="font-bold text-white">{{ partidaACausar()?.concepto }}</span></div>
              <div class="text-slate-400">Monto: <span class="font-mono font-bold text-emerald-400">\${{ Number(partidaACausar()?.valor) | number:'1.2-2' }}</span></div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Tipo de Deducción</label>
              <select [(ngModel)]="tipoNotaSeleccionada" (ngModelChange)="actualizarCuentaSugeridaNota($event)" class="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="GMF_4X1000">Gravamen Movimientos Financieros (4x1000 - 511595)</option>
                <option value="COMISION_BANCARIA">Comisiones y Cuotas de Manejo (530515)</option>
                <option value="INTERES_GANADO">Intereses Financieros Ganados (421005)</option>
              </select>
            </div>

            <!-- Cuenta Contrapartida -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Cuenta PUC de Imputación</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 truncate font-mono">
                  {{ cuentaPucNotaSeleccionada() ? cuentaPucNotaSeleccionada()?.codigo + ' - ' + cuentaPucNotaSeleccionada()?.nombre : 'Seleccione cuenta...' }}
                </div>
                <button
                  type="button"
                  (click)="modalPucNotaVisible.set(true)"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                  🔍 Buscar
                </button>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button (click)="modalCausarNotaAbierto.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancelar</button>
              <button (click)="confirmarCausacionNota()" [disabled]="!cuentaPucNotaSeleccionada()" class="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30">Generar Asiento y Conciliar</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ========================================================================= -->
    <!-- MODALES LOOKUP (ENTERPRISE LOOKUP PATTERN) -->
    <!-- ========================================================================= -->

    <!-- Lookup Tercero para Custodio -->
    <app-tercero-lookup-modal
      [(visible)]="modalTerceroVisible"
      titulo="Seleccionar Responsable / Custodio de Caja"
      [terceros]="tercerosDisponibles()"
      (seleccionado)="onResponsableSeleccionado($event)">
    </app-tercero-lookup-modal>

    <!-- Lookup Tercero para Proveedor Gasto -->
    <app-tercero-lookup-modal
      [(visible)]="modalTerceroGastoVisible"
      titulo="Seleccionar Proveedor / Beneficiario del Gasto"
      [terceros]="tercerosDisponibles()"
      (seleccionado)="onTerceroGastoSeleccionado($event)">
    </app-tercero-lookup-modal>

    <!-- Lookup PUC para Cuenta Caja Menor -->
    <app-puc-lookup-modal
      [(visible)]="modalPucCajaVisible"
      titulo="Seleccionar Cuenta Auxiliar de Caja Menor (110510)"
      [cuentas]="cuentasPucDisponibles()"
      (cuentaSeleccionada)="onCuentaPucCajaSeleccionada($event)">
    </app-puc-lookup-modal>

    <!-- Lookup PUC para Cuenta Gasto -->
    <app-puc-lookup-modal
      [(visible)]="modalPucGastoVisible"
      titulo="Seleccionar Cuenta de Gasto (51 / 52)"
      [cuentas]="cuentasPucDisponibles()"
      (cuentaSeleccionada)="onCuentaPucGastoSeleccionada($event)">
    </app-puc-lookup-modal>

    <!-- Lookup PUC para Cuenta Nota Bancaria -->
    <app-puc-lookup-modal
      [(visible)]="modalPucNotaVisible"
      titulo="Seleccionar Cuenta Contrapartida de Nota Bancaria"
      [cuentas]="cuentasPucDisponibles()"
      (cuentaSeleccionada)="onCuentaPucNotaSeleccionada($event)">
    </app-puc-lookup-modal>
  `,
})
export class TesoreriaAdminComponent implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly tesoreriaService = inject(TesoreriaService);
  private readonly notificaciones = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  // Expose Math and Number to template
  readonly Math = Math;
  readonly Number = Number;

  // Estado reactivo con Signals
  pestanaActiva = signal<'cajas' | 'bancos' | 'conciliacion'>('cajas');
  cargando = signal<boolean>(false);

  cajas = signal<CajaMenorItem[]>([]);
  cuentasBancarias = signal<CuentaBancariaItem[]>([]);
  conciliacionActual = signal<ConciliacionBancariaItem | null>(null);

  // Catálogos para Modales de Búsqueda Avanzada
  tercerosDisponibles = signal<TerceroItem[]>([]);
  cuentasPucDisponibles = signal<CuentaPucLookupItem[]>([]);

  // Filtros de conciliación
  cuentaSeleccionadaId = signal<string>('');
  periodoAnio = signal<number>(2026);
  periodoMes = signal<number>(10);

  // Modales Principales
  modalCrearCajaAbierto = signal<boolean>(false);
  modalGastoAbierto = signal<boolean>(false);
  modalArqueoAbierto = signal<boolean>(false);
  modalReembolsoAbierto = signal<boolean>(false);
  modalImportarExtractoAbierto = signal<boolean>(false);
  modalCausarNotaAbierto = signal<boolean>(false);

  // Visibilidad Modales Lookup
  modalTerceroVisible = signal<boolean>(false);
  modalTerceroGastoVisible = signal<boolean>(false);
  modalPucCajaVisible = signal<boolean>(false);
  modalPucGastoVisible = signal<boolean>(false);
  modalPucNotaVisible = signal<boolean>(false);
  modalPucBancoDesembolsoVisible = signal<boolean>(false);
  modalPucBancoReembolsoVisible = signal<boolean>(false);
  cuentaPucBancoDesembolsoSeleccionada = signal<CuentaPucLookupItem | null>(null);
  cuentaPucBancoReembolsoSeleccionada = signal<CuentaPucLookupItem | null>(null);

  // Formularios reactivos
  formCajaMenor: FormGroup;
  formGasto: FormGroup;
  formExtracto: FormGroup;

  // Selecciones temporales
  responsableSeleccionado = signal<TerceroItem | null>(null);
  cuentaPucCajaSeleccionada = signal<CuentaPucLookupItem | null>(null);
  cajaActiva = signal<CajaMenorItem | null>(null);
  terceroGastoSeleccionado = signal<TerceroItem | null>(null);
  cuentaPucGastoSeleccionada = signal<CuentaPucLookupItem | null>(null);
  cuentaPucNotaSeleccionada = signal<CuentaPucLookupItem | null>(null);

  // Arqueo State
  conteoBilletes: Record<string, number> = {
    '100000': 0,
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0,
    monedas: 0,
  };
  arqueoTotalFisico = signal<number>(0);
  arqueoTotalFondo = signal<number>(0);
  arqueoDiferencia = signal<number>(0);
  arqueoObservaciones = '';

  // Reembolso State
  valesParaReembolso = signal<GastoCajaMenorItem[]>([]);
  valesSeleccionadosIds = signal<string[]>([]);
  cuentaBancoReembolsoId = '';

  // Extracto State
  rawTextoExtracto = '';

  // Causación Nota State
  partidaACausar = signal<any | null>(null);
  tipoNotaSeleccionada = 'GMF_4X1000';

  // Computed properties
  totalFondoFijo = computed(() =>
    this.cajas().reduce((acc, c) => acc + Number(c.monto_fondo_fijo || 0), 0),
  );
  totalEfectivoDisponible = computed(() =>
    this.cajas().reduce((acc, c) => acc + Number(c.saldo_actual_efectivo || 0), 0),
  );
  totalValesPendientes = computed(() =>
    this.cajas().reduce((acc, c) => acc + Number(c.saldo_en_vales || 0), 0),
  );

  totalReembolsoCalculado = computed(() => {
    const seleccionados = this.valesSeleccionadosIds();
    return this.valesParaReembolso()
      .filter((v) => seleccionados.includes(v.id))
      .reduce((acc, v) => acc + Number(v.total || 0), 0);
  });

  constructor() {
    this.formCajaMenor = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      monto_fondo_fijo: [1000000, [Validators.required, Validators.min(1000)]],
      cuenta_banco_origen_id: [''],
    });

    this.formGasto = this.fb.group({
      fecha_gasto: [new Date().toISOString().split('T')[0], Validators.required],
      soporte_factura_ref: [''],
      concepto: ['', Validators.required],
      subtotal: [0, [Validators.required, Validators.min(1)]],
      iva: [0],
      retefuente: [0],
      total: [0, [Validators.required, Validators.min(1)]],
    });

    this.formExtracto = this.fb.group({
      periodo_anio: [2026, Validators.required],
      periodo_mes: [10, Validators.required],
      saldo_inicial: [0, Validators.required],
      saldo_final: [0, Validators.required],
    });
  }

  ngOnInit() {
    this.cargarDatos();
    this.cargarCatalogos();
  }

  cambiarPestana(p: 'cajas' | 'bancos' | 'conciliacion') {
    this.pestanaActiva.set(p);
  }

  cargarDatos() {
    this.cargando.set(true);
    this.tesoreriaService.listarCajasMenores().subscribe({
      next: (data) => this.cajas.set(data),
      error: (err) => this.notificaciones.error('Error al cargar cajas menores', err.message),
    });

    this.tesoreriaService.listarCuentasBancarias().subscribe({
      next: (data) => {
        this.cuentasBancarias.set(data);
        if (data.length > 0 && !this.cuentaSeleccionadaId()) {
          this.cuentaSeleccionadaId.set(data[0].id);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.notificaciones.error('Error al cargar cuentas bancarias', err.message);
        this.cargando.set(false);
      },
    });
  }

  cargarCatalogos() {
    this.http.get<TerceroItem[]>('http://localhost:3000/api/v1/terceros').subscribe({
      next: (t) => this.tercerosDisponibles.set(t || []),
    });

    this.http.get<CuentaPucLookupItem[]>('http://localhost:3000/api/v1/puc').subscribe({
      next: (cuentas) => this.cuentasPucDisponibles.set(cuentas || []),
    });
  }

  // ==========================================
  // LOGICA CAJAS MENORES
  // ==========================================

  abrirModalCrearCaja() {
    this.formCajaMenor.reset({ monto_fondo_fijo: 1000000 });
    this.responsableSeleccionado.set(null);
    this.cuentaPucCajaSeleccionada.set(null);
    this.cuentaPucBancoDesembolsoSeleccionada.set(null);
    this.modalCrearCajaAbierto.set(true);
  }

  onResponsableSeleccionado(t: TerceroItem) {
    this.responsableSeleccionado.set(t);
    this.modalTerceroVisible.set(false);
  }

  onCuentaPucCajaSeleccionada(p: CuentaPucLookupItem) {
    this.cuentaPucCajaSeleccionada.set(p);
    this.modalPucCajaVisible.set(false);
  }

  onCuentaPucBancoDesembolsoSeleccionada(p: CuentaPucLookupItem) {
    this.cuentaPucBancoDesembolsoSeleccionada.set(p);
    this.formCajaMenor.patchValue({ cuenta_banco_origen_id: p.id });
    this.modalPucBancoDesembolsoVisible.set(false);
  }

  limpiarBancoDesembolso() {
    this.cuentaPucBancoDesembolsoSeleccionada.set(null);
    this.formCajaMenor.patchValue({ cuenta_banco_origen_id: '' });
  }

  guardarCajaMenor() {
    if (this.formCajaMenor.invalid || !this.responsableSeleccionado() || !this.cuentaPucCajaSeleccionada()) return;

    const formVal = this.formCajaMenor.value;
    const bancoId = this.cuentaPucBancoDesembolsoSeleccionada()?.id || (formVal.cuenta_banco_origen_id ? formVal.cuenta_banco_origen_id : null);

    const payload: any = {
      codigo: formVal.codigo?.trim(),
      nombre: formVal.nombre?.trim(),
      monto_fondo_fijo: Number(formVal.monto_fondo_fijo),
      responsable_id: this.responsableSeleccionado()?.id,
      cuenta_puc_id: this.cuentaPucCajaSeleccionada()?.id,
    };

    if (formVal.observaciones && formVal.observaciones.trim() !== '') {
      payload.observaciones = formVal.observaciones.trim();
    }

    if (bancoId && bancoId.trim() !== '') {
      payload.cuenta_banco_origen_id = bancoId.trim();
    }

    this.tesoreriaService.crearCajaMenor(payload).subscribe({
      next: (res) => {
        this.notificaciones.success('Caja Menor Constituida', `Se creó la caja ${res.codigo} con fondo de $${Number(res.monto_fondo_fijo).toLocaleString()}`);
        this.modalCrearCajaAbierto.set(false);
        this.cargarDatos();
      },
      error: (err) => this.notificaciones.error('Error al constituir caja menor', err.error?.message || err.message),
    });
  }

  // ==========================================
  // LOGICA GASTOS
  // ==========================================

  abrirModalGasto(caja: CajaMenorItem) {
    this.cajaActiva.set(caja);
    this.formGasto.reset({
      fecha_gasto: new Date().toISOString().split('T')[0],
      subtotal: 0,
      iva: 0,
      retefuente: 0,
      total: 0,
    });
    this.terceroGastoSeleccionado.set(null);
    this.cuentaPucGastoSeleccionada.set(null);
    this.modalGastoAbierto.set(true);
  }

  onTerceroGastoSeleccionado(t: TerceroItem) {
    this.terceroGastoSeleccionado.set(t);
    this.modalTerceroGastoVisible.set(false);
  }

  onCuentaPucGastoSeleccionada(p: CuentaPucLookupItem) {
    this.cuentaPucGastoSeleccionada.set(p);
    this.modalPucGastoVisible.set(false);
  }

  onCuentaPucNotaSeleccionada(p: CuentaPucLookupItem) {
    this.cuentaPucNotaSeleccionada.set(p);
    this.modalPucNotaVisible.set(false);
  }

  recalcularTotalGasto() {
    const subtotal = Number(this.formGasto.get('subtotal')?.value || 0);
    const iva = Number(this.formGasto.get('iva')?.value || 0);
    const rete = Number(this.formGasto.get('retefuente')?.value || 0);
    const total = Math.max(0, subtotal + iva - rete);
    this.formGasto.patchValue({ total });
  }

  guardarGasto() {
    if (this.formGasto.invalid || !this.terceroGastoSeleccionado() || !this.cuentaPucGastoSeleccionada()) return;
    const caja = this.cajaActiva();
    if (!caja) return;

    const payload = {
      ...this.formGasto.value,
      caja_menor_id: caja.id,
      tercero_id: this.terceroGastoSeleccionado()?.id,
      cuenta_gasto_id: this.cuentaPucGastoSeleccionada()?.id,
    };

    this.tesoreriaService.registrarGastoCaja(payload).subscribe({
      next: (res) => {
        this.notificaciones.success('Vale de Gasto Legalizado', `Se registró el vale ${res.consecutivo} por \${{ res.total | number:'1.2-2' }}`);
        this.modalGastoAbierto.set(false);
        this.cargarDatos();
      },
      error: (err) => this.notificaciones.error('Error al registrar gasto', err.error?.message || err.message),
    });
  }

  verGastosCaja(caja: CajaMenorItem) {
    this.tesoreriaService.listarGastosCaja(caja.id).subscribe({
      next: (gastos) => {
        const resumen = gastos.map((g) => `${g.consecutivo}: ${g.concepto} ($${Number(g.total).toLocaleString()}) - [${g.estado}]`).join('\n');
        this.notificaciones.info(`Vales de ${caja.nombre}`, resumen || 'No hay gastos registrados.');
      },
    });
  }

  // ==========================================
  // LOGICA ARQUEO
  // ==========================================

  abrirModalArqueo(caja: CajaMenorItem) {
    this.cajaActiva.set(caja);
    this.conteoBilletes = {
      '100000': 0,
      '50000': 0,
      '20000': 0,
      '10000': 0,
      '5000': 0,
      '2000': 0,
      monedas: 0,
    };
    this.arqueoObservaciones = '';
    this.recalcularArqueo();
    this.modalArqueoAbierto.set(true);
  }

  recalcularArqueo() {
    const totalFisico =
      Number(this.conteoBilletes['100000'] || 0) * 100000 +
      Number(this.conteoBilletes['50000'] || 0) * 50000 +
      Number(this.conteoBilletes['20000'] || 0) * 20000 +
      Number(this.conteoBilletes['10000'] || 0) * 10000 +
      Number(this.conteoBilletes['5000'] || 0) * 5000 +
      Number(this.conteoBilletes['2000'] || 0) * 2000 +
      Number(this.conteoBilletes['monedas'] || 0);

    const vales = Number(this.cajaActiva()?.saldo_en_vales || 0);
    const fondoFijo = Number(this.cajaActiva()?.monto_fondo_fijo || 0);

    this.arqueoTotalFisico.set(totalFisico);
    this.arqueoTotalFondo.set(totalFisico + vales);
    this.arqueoDiferencia.set(totalFisico + vales - fondoFijo);
  }

  guardarArqueo() {
    const caja = this.cajaActiva();
    if (!caja) return;

    const payload = {
      caja_menor_id: caja.id,
      fecha_arqueo: new Date().toISOString(),
      desglose_efectivo: this.conteoBilletes,
      total_efectivo_fisico: this.arqueoTotalFisico(),
      observaciones: this.arqueoObservaciones,
    };

    this.tesoreriaService.registrarArqueo(payload).subscribe({
      next: (res) => {
        this.notificaciones.success('Acta de Arqueo Guardada', `Resultado: ${res.resultado}. Diferencia: \${{ res.diferencia | number:'1.2-2' }}`);
        this.modalArqueoAbierto.set(false);
      },
      error: (err) => this.notificaciones.error('Error al guardar arqueo', err.error?.message || err.message),
    });
  }

  // ==========================================
  // LOGICA REEMBOLSO
  // ==========================================

  abrirModalReembolso(caja: CajaMenorItem) {
    this.cajaActiva.set(caja);
    this.cuentaBancoReembolsoId = '';
    this.cuentaPucBancoReembolsoSeleccionada.set(null);
    this.valesSeleccionadosIds.set([]);
    this.tesoreriaService.listarGastosCaja(caja.id, 'LEGALIZADO').subscribe({
      next: (vales) => {
        this.valesParaReembolso.set(vales);
        this.valesSeleccionadosIds.set(vales.map((v) => v.id));
        this.modalReembolsoAbierto.set(true);
      },
    });
  }

  toggleSeleccionVale(id: string) {
    const actuales = this.valesSeleccionadosIds();
    if (actuales.includes(id)) {
      this.valesSeleccionadosIds.set(actuales.filter((vId) => vId !== id));
    } else {
      this.valesSeleccionadosIds.set([...actuales, id]);
    }
  }

  ejecutarReembolso() {
    const caja = this.cajaActiva();
    if (!caja || !this.cuentaBancoReembolsoId || this.valesSeleccionadosIds().length === 0) return;

    const payload = {
      caja_menor_id: caja.id,
      fecha_egreso: new Date().toISOString().split('T')[0],
      cuenta_banco_pago_id: this.cuentaBancoReembolsoId,
      gastos_ids: this.valesSeleccionadosIds(),
    };

    this.tesoreriaService.reembolsarCaja(payload).subscribe({
      next: (res) => {
        this.notificaciones.success('Egreso de Reembolso Emitido', `Comprobante ${res.asiento?.numero_comprobante} por \${{ res.totalReembolsado | number:'1.2-2' }}`);
        this.modalReembolsoAbierto.set(false);
        this.cargarDatos();
      },
      error: (err) => this.notificaciones.error('Error al reembolsar caja', err.error?.message || err.message),
    });
  }

  // ==========================================
  // LOGICA CUENTAS BANCARIAS & LIBRO AUXILIAR
  // ==========================================

  abrirModalCrearCuenta() {
    this.notificaciones.info('Registro de Cuenta', 'Abriendo formulario de cuenta bancaria...');
  }

  abrirLibroAuxiliar(cta: CuentaBancariaItem) {
    this.tesoreriaService.obtenerLibroAuxiliar(cta.id).subscribe({
      next: (data) => {
        const resumen = `Cuenta: ${cta.banco_nombre} ${cta.numero_cuenta}\nTotal Débitos: $${data.totalDebitos.toLocaleString()}\nTotal Créditos: $${data.totalCreditos.toLocaleString()}\nSaldo en Libros: $${data.saldoFinalLibros.toLocaleString()}`;
        this.notificaciones.info('Libro Auxiliar Contable (1110)', resumen);
      },
    });
  }

  // ==========================================
  // LOGICA CONCILIACION BANCARIA
  // ==========================================

  abrirModalImportarExtracto() {
    this.formExtracto.patchValue({
      periodo_anio: this.periodoAnio(),
      periodo_mes: this.periodoMes(),
      saldo_inicial: 5000000,
      saldo_final: 6044000,
    });
    this.rawTextoExtracto = `2026-10-05, Consignacion cliente ferreteria, 44012, CREDITO, 1500000\n2026-10-15, Pago cheque proveedor, 1023, DEBITO, 450000\n2026-10-31, Cobro GMF 4x1000, GMF-10, DEBITO, 6000`;
    this.modalImportarExtractoAbierto.set(true);
  }

  guardarExtracto() {
    if (!this.cuentaSeleccionadaId()) {
      this.notificaciones.error('Seleccione Cuenta', 'Debe seleccionar una cuenta bancaria');
      return;
    }

    const lineasParseadas = this.rawTextoExtracto
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => {
        const parts = l.split(',').map((p) => p.trim());
        return {
          fecha: parts[0] || new Date().toISOString().split('T')[0],
          descripcion: parts[1] || 'Movimiento bancario',
          referencia: parts[2] || '',
          tipo_movimiento: (parts[3] || 'CREDITO').toUpperCase() as any,
          valor: Number(parts[4] || 0),
        };
      });

    const payload = {
      cuenta_bancaria_id: this.cuentaSeleccionadaId(),
      periodo_anio: Number(this.formExtracto.get('periodo_anio')?.value),
      periodo_mes: Number(this.formExtracto.get('periodo_mes')?.value),
      fecha_corte: new Date().toISOString().split('T')[0],
      saldo_inicial: Number(this.formExtracto.get('saldo_inicial')?.value),
      saldo_final: Number(this.formExtracto.get('saldo_final')?.value),
      nombre_archivo: 'extracto_bancario_oficial.csv',
      lineas: lineasParseadas,
    };

    this.tesoreriaService.importarExtracto(payload).subscribe({
      next: (res) => {
        this.notificaciones.success('Extracto Importado', `Se importaron ${res.lineas?.length || 0} movimientos bancarios`);
        this.modalImportarExtractoAbierto.set(false);
      },
      error: (err) => this.notificaciones.error('Error al importar extracto', err.error?.message || err.message),
    });
  }

  ejecutarConciliacion() {
    if (!this.cuentaSeleccionadaId()) {
      this.notificaciones.error('Error', 'Seleccione una cuenta bancaria');
      return;
    }

    this.cargando.set(true);

    this.tesoreriaService.listarExtractos(this.cuentaSeleccionadaId()).subscribe({
      next: (extractos) => {
        const ext = extractos.find(
          (e) => e.periodo_anio === Number(this.periodoAnio()) && e.periodo_mes === Number(this.periodoMes()),
        );

        if (!ext) {
          this.cargando.set(false);
          this.notificaciones.warning('Extracto Requerido', `No se encontró un extracto importado para ${this.periodoMes()}/${this.periodoAnio()}. Importe el extracto primero.`);
          return;
        }

        const payload = {
          cuenta_bancaria_id: this.cuentaSeleccionadaId(),
          extracto_id: ext.id,
          periodo_anio: Number(this.periodoAnio()),
          periodo_mes: Number(this.periodoMes()),
          fecha_conciliacion: new Date().toISOString().split('T')[0],
        };

        this.tesoreriaService.ejecutarConciliacion(payload).subscribe({
          next: (conc) => {
            this.conciliacionActual.set(conc);
            this.cargando.set(false);
            if (conc.diferencia_descuadre <= 0.05) {
              this.notificaciones.success('Conciliación Exitosa', 'La conciliación bancaria está completamente cuadrada al centavo ($0.00)');
            } else {
              this.notificaciones.warning('Partidas Pendientes', `La conciliación presenta una diferencia de descuadre de \${{ conc.diferencia_descuadre | number:'1.2-2' }}`);
            }
          },
          error: (err) => {
            this.cargando.set(false);
            this.notificaciones.error('Error en conciliación', err.error?.message || err.message);
          },
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.notificaciones.error('Error al verificar extracto', err.message);
      },
    });
  }

  abrirModalCausarNota(partida: any) {
    this.partidaACausar.set(partida);
    this.tipoNotaSeleccionada = partida.concepto?.toLowerCase().includes('gmf') || partida.concepto?.toLowerCase().includes('4x1000') ? 'GMF_4X1000' : 'COMISION_BANCARIA';
    this.actualizarCuentaSugeridaNota(this.tipoNotaSeleccionada);
    this.modalCausarNotaAbierto.set(true);
  }

  actualizarCuentaSugeridaNota(tipo: string) {
    if (tipo === 'GMF_4X1000') {
      this.cuentaPucNotaSeleccionada.set({
        id: 'puc-gmf',
        codigo: '511595',
        nombre: 'Gravamen a los Movimientos Financieros (4x1000)',
      } as any);
    } else if (tipo === 'COMISION_BANCARIA') {
      this.cuentaPucNotaSeleccionada.set({
        id: 'puc-comision',
        codigo: '530515',
        nombre: 'Comisiones y Gastos Bancarios',
      } as any);
    } else {
      this.cuentaPucNotaSeleccionada.set({
        id: 'puc-interes',
        codigo: '421005',
        nombre: 'Intereses Financieros Ganados',
      } as any);
    }
  }

  confirmarCausacionNota() {
    const p = this.partidaACausar();
    if (!p || !this.cuentaPucNotaSeleccionada()) return;

    const payload = {
      cuenta_bancaria_id: this.cuentaSeleccionadaId(),
      extracto_linea_id: p.extracto_linea_id,
      fecha_asiento: new Date().toISOString().split('T')[0],
      tipo_nota: this.tipoNotaSeleccionada,
      cuenta_contrapartida_id: this.cuentaPucNotaSeleccionada()?.id,
    };

    this.tesoreriaService.causarNotaBancaria(payload).subscribe({
      next: (res) => {
        this.notificaciones.success('Nota Bancaria Causada', `Se generó comprobante ${res.asiento?.numero_comprobante} y se concilió la partida.`);
        this.modalCausarNotaAbierto.set(false);
        this.ejecutarConciliacion();
      },
      error: (err) => this.notificaciones.error('Error al causar nota', err.error?.message || err.message),
    });
  }

  aprobarConciliacion(id: string) {
    this.tesoreriaService.aprobarConciliacion(id).subscribe({
      next: (conc) => {
        this.conciliacionActual.set(conc);
        this.notificaciones.success('Conciliación Aprobada', 'La conciliación ha sido aprobada con estatus oficial para revisoría fiscal.');
      },
      error: (err) => this.notificaciones.error('Error al aprobar', err.error?.message || err.message),
    });
  }

  imprimirConciliacion() {
    window.print();
  }
}
