import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

interface ProveedorItem {
  id: string;
  numero_identificacion: string;
  nombre_completo: string;
}

interface ConceptoMapeo {
  id: string;
  codigo_concepto: string;
  nombre_concepto: string;
  reglas_impuestos_codigos?: string[];
}

interface CuentaBancoItem {
  id: string;
  codigo: string;
  nombre: string;
}

interface CuentaPorPagarItem {
  id: string;
  numero_factura_proveedor: string;
  tercero?: {
    numero_identificacion: string;
    nombre_completo: string;
  };
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  total_impuestos: number;
  total_factura: number;
  saldo_pendiente: number;
  estado: 'PENDIENTE' | 'PAGADA_PARCIAL' | 'PAGADA_TOTAL';
  glosa?: string;
  asiento?: {
    numero_comprobante: string;
  };
}

interface ResumenCartera {
  total_cartera: number;
  total_vencida: number;
  total_por_vencer: number;
  conteo_facturas: number;
}

interface PagoHistorial {
  id: string;
  monto_pago: number;
  fecha_pago: string;
  metodo_pago: string;
  referencia_transaccion?: string;
  glosa?: string;
  asiento?: {
    numero_comprobante: string;
  };
}

@Component({
  selector: 'app-cxp-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📦</span>
            Cuentas por Pagar & Egresos (CxP)
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Causación de facturas de compra/gastos, liquidación tributaria y emisión de comprobantes de egreso
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="sembrarConceptos()"
            class="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Inicializar conceptos de compra estándar"
          >
            ⚡ Sembrar Conceptos
          </button>

          <button
            type="button"
            (click)="abrirModalCausar()"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            + Causar Factura de Proveedor
          </button>
        </div>
      </div>

      <!-- Tarjetas de Cartera Ejecutiva -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Total Deuda a Proveedores</span>
          <p class="text-2xl font-bold text-white mt-1">
            {{ cartera()?.total_cartera || 0 | currency:'COP':'symbol-narrow':'1.0-0' }}
          </p>
          <span class="text-[11px] text-slate-500">{{ cartera()?.conteo_facturas || 0 }} facturas abiertas</span>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Cartera Por Vencer</span>
          <p class="text-2xl font-bold text-emerald-400 mt-1">
            {{ cartera()?.total_por_vencer || 0 | currency:'COP':'symbol-narrow':'1.0-0' }}
          </p>
          <span class="text-[11px] text-slate-500">Dentro del plazo comercial</span>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Cartera Vencida</span>
          <p class="text-2xl font-bold text-rose-400 mt-1">
            {{ cartera()?.total_vencida || 0 | currency:'COP':'symbol-narrow':'1.0-0' }}
          </p>
          <span class="text-[11px] text-slate-500">Requiere pago prioritario</span>
        </div>

        <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <span class="text-xs font-medium text-slate-400">Conceptos Operativos</span>
          <p class="text-2xl font-bold text-indigo-400 mt-1">{{ conceptos().length }}</p>
          <span class="text-[11px] text-slate-500">Mapeos contables activos</span>
        </div>
      </div>

      <!-- Tabla de Facturas CxP -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Factura Proveedor</th>
                <th class="py-3 px-4">Proveedor</th>
                <th class="py-3 px-4">Emisión / Vencimiento</th>
                <th class="py-3 px-4 text-right">Total Factura</th>
                <th class="py-3 px-4 text-right">Saldo Pendiente</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (cxp of facturas(); track cxp.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-mono font-bold text-white">
                    {{ cxp.numero_factura_proveedor }}
                    <span *ngIf="cxp.asiento?.numero_comprobante" class="block text-[10px] text-slate-500 font-mono font-normal">
                      Asiento: {{ cxp.asiento?.numero_comprobante }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-medium text-slate-200 block">{{ cxp.tercero?.nombre_completo }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ cxp.tercero?.numero_identificacion }}</span>
                  </td>
                  <td class="py-3 px-4 font-mono text-[11px]">
                    <span class="text-slate-400 block">{{ cxp.fecha_emision }}</span>
                    <span [class]="esVencida(cxp.fecha_vencimiento, cxp.saldo_pendiente) ? 'text-rose-400 font-bold' : 'text-slate-500'">
                      Vence: {{ cxp.fecha_vencimiento }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right font-mono text-white">
                    {{ cxp.total_factura | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold" [class]="cxp.saldo_pendiente > 0 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ cxp.saldo_pendiente | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [ngClass]="{
                        'bg-amber-500/10 text-amber-400 border-amber-500/20': cxp.estado === 'PENDIENTE',
                        'bg-blue-500/10 text-blue-400 border-blue-500/20': cxp.estado === 'PAGADA_PARCIAL',
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': cxp.estado === 'PAGADA_TOTAL'
                      }"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ cxp.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      *ngIf="cxp.saldo_pendiente > 0"
                      (click)="abrirModalPago(cxp)"
                      class="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition"
                    >
                      Pagar (EGR)
                    </button>
                    <button
                      (click)="verHistorialPagos(cxp)"
                      class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    >
                      Pagos
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500 text-xs">
                    No hay facturas de proveedores causadas todavía en esta empresa.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Causar Factura CxP -->
      <div *ngIf="mostrarModalCausar()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400">📥</span>
              Causar Factura de Compra / Gasto (CxP)
            </h3>
            <button (click)="mostrarModalCausar.set(false)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold">&times;</button>
          </div>

          <div *ngIf="errorMsg()" class="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            {{ errorMsg() }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Proveedor (Tercero) *</label>
              <select
                [(ngModel)]="nuevaFactura.tercero_id"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Seleccionar Proveedor --</option>
                <option *ngFor="let p of proveedores()" [value]="p.id">
                  {{ p.numero_identificacion }} - {{ p.nombre_completo }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Concepto Operativo *</label>
              <select
                [(ngModel)]="nuevaFactura.codigo_concepto"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Seleccionar Concepto --</option>
                <option *ngFor="let c of conceptos()" [value]="c.codigo_concepto">
                  {{ c.nombre_concepto }} ({{ c.codigo_concepto }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Número Factura Proveedor *</label>
              <input
                type="text"
                [(ngModel)]="nuevaFactura.numero_factura_proveedor"
                placeholder="Ej: FAC-1024 o FE-9821"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Subtotal (Antes de IVA) *</label>
              <input
                type="number"
                min="1"
                step="any"
                [(ngModel)]="nuevaFactura.subtotal"
                placeholder="0.00"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono text-right focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Fecha Emisión *</label>
              <input
                type="date"
                [(ngModel)]="nuevaFactura.fecha_emision"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Fecha Vencimiento *</label>
              <input
                type="date"
                [(ngModel)]="nuevaFactura.fecha_vencimiento"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Observación / Glosa</label>
              <input
                type="text"
                [(ngModel)]="nuevaFactura.glosa"
                placeholder="Ej: Compra de repuestos y materiales de trabajo mensual"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              (click)="mostrarModalCausar.set(false)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardarCausacion()"
              [disabled]="guardando() || !puedeCausar()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition"
            >
              {{ guardando() ? 'Causando Asiento...' : 'Causar Factura NIIF' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Registrar Pago / Egreso -->
      <div *ngIf="facturaAPagar()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400">💸</span>
              Registrar Pago / Egreso (EGR)
            </h3>
            <button (click)="facturaAPagar.set(null)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold">&times;</button>
          </div>

          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">Factura:</span>
              <span class="font-bold text-white font-mono">{{ facturaAPagar()?.numero_factura_proveedor }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Proveedor:</span>
              <span class="text-slate-200">{{ facturaAPagar()?.tercero?.nombre_completo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Saldo Pendiente:</span>
              <span class="font-bold text-amber-400 font-mono">{{ facturaAPagar()?.saldo_pendiente | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Cuenta de Banco o Caja *</label>
              <select
                [(ngModel)]="nuevoPago.cuenta_banco_id"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Seleccionar Banco o Caja --</option>
                <option *ngFor="let b of cuentasBanco()" [value]="b.id">
                  {{ b.codigo }} - {{ b.nombre }}
                </option>
              </select>
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-semibold text-slate-300">Monto a Pagar ($) *</label>
                <button
                  type="button"
                  (click)="nuevoPago.monto_pago = facturaAPagar()?.saldo_pendiente || 0"
                  class="text-[11px] text-indigo-400 hover:underline"
                >
                  Pagar Saldo Total
                </button>
              </div>
              <input
                type="number"
                min="1"
                [max]="facturaAPagar()?.saldo_pendiente || 0"
                step="any"
                [(ngModel)]="nuevoPago.monto_pago"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono text-right focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Método de Pago *</label>
                <select
                  [(ngModel)]="nuevoPago.metodo_pago"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="CONSIGNACION">Consignación</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="EFECTIVO">Efectivo / Caja</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Fecha de Pago *</label>
                <input
                  type="date"
                  [(ngModel)]="nuevoPago.fecha_pago"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Referencia Bancaria / Comprobante</label>
              <input
                type="text"
                [(ngModel)]="nuevoPago.referencia_transaccion"
                placeholder="Ej: TRX-9921 o Cheque #450"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              (click)="facturaAPagar.set(null)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardarPago()"
              [disabled]="guardando() || !puedePagar()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition"
            >
              {{ guardando() ? 'Generando EGR...' : 'Generar Comprobante Egreso' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Historial de Pagos -->
      <div *ngIf="historialPagos()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white">Historial de Pagos y Egresos (EGR)</h3>
            <button (click)="historialPagos.set(null)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold">&times;</button>
          </div>

          <div class="overflow-x-auto max-h-64 overflow-y-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th class="py-2.5 px-3">Fecha</th>
                  <th class="py-2.5 px-3">Método / Ref</th>
                  <th class="py-2.5 px-3">Comprobante Egreso</th>
                  <th class="py-2.5 px-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr *ngFor="let p of historialPagos()" class="hover:bg-slate-800/30">
                  <td class="py-2.5 px-3 font-mono text-slate-400">{{ p.fecha_pago }}</td>
                  <td class="py-2.5 px-3">
                    <span class="block font-semibold text-slate-200">{{ p.metodo_pago }}</span>
                    <span class="text-[10px] font-mono text-slate-500">{{ p.referencia_transaccion || '-' }}</span>
                  </td>
                  <td class="py-2.5 px-3 font-mono font-bold text-indigo-400">
                    {{ p.asiento?.numero_comprobante || 'EGR' }}
                  </td>
                  <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {{ p.monto_pago | currency:'COP':'symbol-narrow':'1.0-0' }}
                  </td>
                </tr>
                <tr *ngIf="historialPagos()?.length === 0">
                  <td colspan="4" class="py-6 text-center text-slate-500">
                    No se han registrado pagos para esta factura aún.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end pt-2">
            <button
              (click)="historialPagos.set(null)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CxpAdminComponent implements OnInit {
  facturas = signal<CuentaPorPagarItem[]>([]);
  cartera = signal<ResumenCartera | null>(null);
  proveedores = signal<ProveedorItem[]>([]);
  conceptos = signal<ConceptoMapeo[]>([]);
  cuentasBanco = signal<CuentaBancoItem[]>([]);

  mostrarModalCausar = signal<boolean>(false);
  facturaAPagar = signal<CuentaPorPagarItem | null>(null);
  historialPagos = signal<PagoHistorial[] | null>(null);

  guardando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  nuevaFactura = {
    tercero_id: '',
    codigo_concepto: '',
    numero_factura_proveedor: '',
    fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    subtotal: 0,
    glosa: '',
  };

  nuevoPago = {
    cuenta_banco_id: '',
    monto_pago: 0,
    fecha_pago: new Date().toISOString().slice(0, 10),
    metodo_pago: 'TRANSFERENCIA',
    referencia_transaccion: '',
  };

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    // Facturas CxP
    this.http
      .get<CuentaPorPagarItem[]>(`http://localhost:3000/api/v1/cxp?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.facturas.set(data),
        error: (err) => console.error('Error cargando CxP:', err),
      });

    // Resumen Cartera
    this.http
      .get<ResumenCartera>(`http://localhost:3000/api/v1/cxp/cartera/${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.cartera.set(data),
        error: (err) => console.error('Error cargando cartera:', err),
      });

    // Proveedores
    this.http
      .get<any[]>(`http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => {
          this.proveedores.set(data);
        },
        error: (err) => console.error('Error cargando proveedores:', err),
      });

    // Conceptos Mapeo
    this.http
      .get<ConceptoMapeo[]>(`http://localhost:3000/api/v1/mapeo-conceptos?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.conceptos.set(data),
        error: (err) => console.error('Error cargando conceptos:', err),
      });

    // Cuentas de banco/caja (clase 11)
    this.http
      .get<any[]>(`http://localhost:3000/api/v1/puc?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (cuentas) => {
          const bancos = cuentas.filter(
            (c) => c.es_auxiliar && (c.codigo.startsWith('1105') || c.codigo.startsWith('1110')),
          );
          this.cuentasBanco.set(bancos);
        },
        error: (err) => console.error('Error cargando bancos:', err),
      });
  }

  sembrarConceptos(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .post(`http://localhost:3000/api/v1/mapeo-conceptos/sembrar/${emp.empresa_id}`, {})
      .subscribe({
        next: () => {
          alert('¡Catálogo estándar de conceptos operativos sembrado con éxito!');
          this.cargarDatos();
        },
        error: (err) => alert(err.error?.message || 'Error al sembrar conceptos.'),
      });
  }

  esVencida(fechaVencimiento: string, saldo: number): boolean {
    if (saldo <= 0) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return fechaVencimiento < hoy;
  }

  abrirModalCausar(): void {
    this.nuevaFactura = {
      tercero_id: '',
      codigo_concepto: this.conceptos()[0]?.codigo_concepto || '',
      numero_factura_proveedor: '',
      fecha_emision: new Date().toISOString().slice(0, 10),
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      subtotal: 0,
      glosa: '',
    };
    this.errorMsg.set(null);
    this.mostrarModalCausar.set(true);
  }

  puedeCausar(): boolean {
    return (
      this.nuevaFactura.tercero_id.trim() !== '' &&
      this.nuevaFactura.codigo_concepto.trim() !== '' &&
      this.nuevaFactura.numero_factura_proveedor.trim() !== '' &&
      this.nuevaFactura.subtotal > 0
    );
  }

  guardarCausacion(): void {
    if (!this.puedeCausar()) return;

    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      empresa_id: emp.empresa_id,
      tercero_id: this.nuevaFactura.tercero_id,
      codigo_concepto: this.nuevaFactura.codigo_concepto,
      numero_factura_proveedor: this.nuevaFactura.numero_factura_proveedor.trim(),
      fecha_emision: this.nuevaFactura.fecha_emision,
      fecha_vencimiento: this.nuevaFactura.fecha_vencimiento,
      subtotal: Number(this.nuevaFactura.subtotal),
      glosa: this.nuevaFactura.glosa.trim() || undefined,
    };

    this.http.post('http://localhost:3000/api/v1/cxp/causar', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCausar.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.message || 'Error causando la factura.';
        this.errorMsg.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  abrirModalPago(cxp: CuentaPorPagarItem): void {
    this.facturaAPagar.set(cxp);
    this.nuevoPago = {
      cuenta_banco_id: this.cuentasBanco()[0]?.id || '',
      monto_pago: cxp.saldo_pendiente,
      fecha_pago: new Date().toISOString().slice(0, 10),
      metodo_pago: 'TRANSFERENCIA',
      referencia_transaccion: '',
    };
  }

  puedePagar(): boolean {
    return (
      this.nuevoPago.cuenta_banco_id.trim() !== '' &&
      this.nuevoPago.monto_pago > 0 &&
      this.nuevoPago.monto_pago <= (this.facturaAPagar()?.saldo_pendiente || 0)
    );
  }

  guardarPago(): void {
    const factura = this.facturaAPagar();
    if (!factura || !this.puedePagar()) return;

    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.guardando.set(true);

    const payload = {
      empresa_id: emp.empresa_id,
      cuenta_por_pagar_id: factura.id,
      cuenta_banco_id: this.nuevoPago.cuenta_banco_id,
      monto_pago: Number(this.nuevoPago.monto_pago),
      fecha_pago: this.nuevoPago.fecha_pago,
      metodo_pago: this.nuevoPago.metodo_pago,
      referencia_transaccion: this.nuevoPago.referencia_transaccion.trim() || undefined,
      glosa: `Pago factura ${factura.numero_factura_proveedor}`,
    };

    this.http.post('http://localhost:3000/api/v1/cxp/pagar', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.facturaAPagar.set(null);
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        alert(err.error?.message || 'Error registrando el pago.');
      },
    });
  }

  verHistorialPagos(cxp: CuentaPorPagarItem): void {
    this.http.get<PagoHistorial[]>(`http://localhost:3000/api/v1/cxp/${cxp.id}/pagos`).subscribe({
      next: (data) => this.historialPagos.set(data),
      error: (err) => console.error('Error cargando historial de pagos:', err),
    });
  }
}
