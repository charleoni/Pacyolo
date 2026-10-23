import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';
import { NotificationService } from '../../../core/services/notification.service';

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

interface AsientoLineaItem {
  id: string;
  debito: number;
  credito: number;
  base_impuesto?: number;
  glosa_detalle?: string;
  documento_referencia?: string;
  cuenta?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  tercero?: {
    id: string;
    numero_identificacion: string;
    nombre_completo: string;
  };
}

interface CuentaPorPagarItem {
  id: string;
  numero_factura_proveedor: string;
  tercero?: {
    id?: string;
    numero_identificacion: string;
    nombre_completo: string;
    ciudad?: string;
    direccion?: string;
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
    id?: string;
    numero_comprobante: string;
    fecha_contable?: string;
    glosa_general?: string;
    total_debito?: number;
    total_credito?: number;
    lineas?: AsientoLineaItem[];
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
  estado?: 'APLICADO' | 'ANULADO';
  asiento?: {
    id?: string;
    numero_comprobante: string;
    lineas?: AsientoLineaItem[];
  };
  cuenta_banco?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  cuenta_por_pagar?: {
    id: string;
    numero_factura_proveedor: string;
    monto_total?: number;
    tercero?: any;
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

      <!-- Pestañas de CxP & Reportes Analíticos -->
      <div class="flex items-center gap-1 border-b border-slate-800 pb-px overflow-x-auto text-xs">
        <button
          type="button"
          (click)="pestanaCxp.set('facturas')"
          [class]="pestanaCxp() === 'facturas' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>📄 Cartera de Facturas & Pagos</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {{ facturas().length }}
          </span>
        </button>

        <button
          type="button"
          (click)="pestanaCxp.set('estado_cuenta'); autoSeleccionarProveedorEstado()"
          [class]="pestanaCxp() === 'estado_cuenta' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>📑 Estado de Cuenta por Proveedor</span>
        </button>

        <button
          type="button"
          (click)="pestanaCxp.set('extracto'); autoSeleccionarProveedorExtracto()"
          [class]="pestanaCxp() === 'extracto' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>⏱️ Extracto Cronológico</span>
        </button>

        <button
          type="button"
          (click)="pestanaCxp.set('edades'); cargarEdadesCartera()"
          [class]="pestanaCxp() === 'edades' ? 'border-indigo-500 text-white font-bold bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer rounded-t-lg"
        >
          <span>📊 Matriz de Vencimiento por Edades</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- PESTAÑA 1: CARTERA DE FACTURAS & PAGOS                                    -->
      <!-- ========================================================================= -->
      @if (pestanaCxp() === 'facturas') {
        <div class="space-y-6">
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

          <!-- Barra de Búsqueda y Filtros de Facturas CxP -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="relative w-full sm:w-96">
              <input
                type="text"
                [(ngModel)]="busquedaFactura"
                placeholder="Buscar por N° Factura, Proveedor, NIT o Asiento..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <span class="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
              @if (busquedaFactura) {
                <button (click)="busquedaFactura = ''" class="absolute right-3 top-2 text-slate-500 hover:text-white cursor-pointer">✕</button>
              }
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>Registros: <span class="text-indigo-400 font-bold font-mono">{{ facturasFiltradas().length }}</span></span>
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
                  @for (cxp of facturasFiltradas(); track cxp.id) {
                    <tr class="hover:bg-slate-800/30 transition">
                      <td class="py-3 px-4 font-mono font-bold text-white">
                        {{ cxp.numero_factura_proveedor }}
                        <span *ngIf="cxp.asiento?.numero_comprobante" class="block text-[10px] text-indigo-400 font-mono font-semibold">
                          {{ cxp.asiento?.numero_comprobante }}
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
                          type="button"
                          (click)="abrirModalImprimirCausacion(cxp)"
                          class="px-2.5 py-1 text-xs text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition cursor-pointer inline-flex items-center gap-1"
                          title="Consultar e imprimir comprobante formal de causación contable"
                        >
                          <span>🖨️</span>
                          <span>Comprobante CAU</span>
                        </button>
                        <button
                          *ngIf="cxp.saldo_pendiente > 0"
                          (click)="abrirModalPago(cxp)"
                          class="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition cursor-pointer"
                        >
                          Pagar (EGR)
                        </button>
                        <button
                          (click)="verHistorialPagos(cxp)"
                          class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
                        >
                          Pagos
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="py-12 text-center text-slate-500 text-xs">
                        No se encontraron facturas coincidentes con la búsqueda.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 2: ESTADO DE CUENTA POR PROVEEDOR                                 -->
      <!-- ========================================================================= -->
      @if (pestanaCxp() === 'estado_cuenta') {
        <div class="space-y-6">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-1">
              <label class="text-xs font-semibold text-slate-300 whitespace-nowrap">Proveedor:</label>
              <select
                [(ngModel)]="proveedorSeleccionadoEstado"
                (change)="cargarEstadoCuenta()"
                class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 flex-1 max-w-md"
              >
                <option value="">-- Seleccionar Proveedor para Estado de Cuenta --</option>
                @for (p of proveedores(); track p.id) {
                  <option [value]="p.id">{{ p.numero_identificacion }} - {{ p.nombre_completo }}</option>
                }
              </select>
            </div>

            <button
              (click)="imprimirReporte()"
              class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <span>🖨️ Imprimir Estado de Cuenta</span>
            </button>
          </div>

          @if (datosEstadoCuenta()) {
            <!-- Tarjetas de Resumen del Proveedor -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span class="text-xs text-slate-400">Saldo Total Pendiente</span>
                <p class="text-2xl font-bold text-white mt-1">
                  {{ datosEstadoCuenta().resumen.saldo_total | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
                <span class="text-[11px] text-slate-500">{{ datosEstadoCuenta().resumen.conteo_pendientes }} facturas por cancelar</span>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span class="text-xs text-slate-400">Deuda en Mora (Vencida)</span>
                <p class="text-2xl font-bold text-rose-400 mt-1">
                  {{ datosEstadoCuenta().resumen.total_vencido | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
                <span class="text-[11px] text-rose-400/80">Plazo comercial expirado</span>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span class="text-xs text-slate-400">Deuda Corriente (Al Día)</span>
                <p class="text-2xl font-bold text-emerald-400 mt-1">
                  {{ datosEstadoCuenta().resumen.total_corriente | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
                <span class="text-[11px] text-emerald-400/80">Dentro de la fecha límite</span>
              </div>
            </div>

            <!-- Tabla de Facturas del Proveedor -->
            <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <div class="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h4 class="text-sm font-bold text-white">{{ datosEstadoCuenta().proveedor.nombre_completo }}</h4>
                  <p class="text-xs text-slate-400 font-mono">
                    NIT: {{ datosEstadoCuenta().proveedor.numero_identificacion }}{{ datosEstadoCuenta().proveedor.dv !== null ? '-' + datosEstadoCuenta().proveedor.dv : '' }} | {{ datosEstadoCuenta().proveedor.email || 'Sin correo' }} | {{ datosEstadoCuenta().proveedor.telefono || 'Sin teléfono' }}
                  </p>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th class="py-3 px-4">Factura N°</th>
                      <th class="py-3 px-4">Emisión</th>
                      <th class="py-3 px-4">Vencimiento</th>
                      <th class="py-3 px-4 text-center">Días de Mora</th>
                      <th class="py-3 px-4 text-right">Total Factura</th>
                      <th class="py-3 px-4 text-right">Abonos</th>
                      <th class="py-3 px-4 text-right">Saldo Pendiente</th>
                      <th class="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-mono">
                    @for (fac of datosEstadoCuenta().facturas; track fac.id) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="py-3 px-4 font-bold text-white">
                          {{ fac.numero_factura_proveedor }}
                          <span *ngIf="fac.comprobante" class="block text-[10px] text-slate-500 font-normal">
                            Asiento: {{ fac.comprobante }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-slate-400 font-sans">{{ fac.fecha_emision }}</td>
                        <td class="py-3 px-4 font-sans" [class]="fac.es_vencida ? 'text-rose-400 font-bold' : 'text-slate-300'">
                          {{ fac.fecha_vencimiento }}
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span
                            [class]="fac.dias_mora > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold' : 'bg-slate-800 text-slate-400'"
                            class="px-2 py-0.5 rounded-full text-[10px] border"
                          >
                            {{ fac.dias_mora > 0 ? fac.dias_mora + ' días' : 'Al día' }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-right text-white">
                          {{ fac.total_factura | currency:'COP':'symbol-narrow':'1.0-0' }}
                        </td>
                        <td class="py-3 px-4 text-right text-emerald-400">
                          {{ fac.abonos | currency:'COP':'symbol-narrow':'1.0-0' }}
                        </td>
                        <td class="py-3 px-4 text-right font-bold" [class]="fac.saldo_pendiente > 0 ? 'text-amber-400' : 'text-emerald-400'">
                          {{ fac.saldo_pendiente | currency:'COP':'symbol-narrow':'1.0-0' }}
                        </td>
                        <td class="py-3 px-4 text-center font-sans">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {{ fac.estado }}
                          </span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="py-8 text-center text-slate-500 font-sans">
                          Este proveedor no tiene facturas registradas.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 3: EXTRACTO CRONOLÓGICO DE PROVEEDOR                              -->
      <!-- ========================================================================= -->
      @if (pestanaCxp() === 'extracto') {
        <div class="space-y-6">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-3 flex-1 min-w-[280px]">
              <label class="font-semibold text-slate-300 whitespace-nowrap">Proveedor:</label>
              <select
                [(ngModel)]="proveedorSeleccionadoExtracto"
                (change)="cargarExtracto()"
                class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 w-full"
              >
                <option value="">-- Seleccionar Proveedor --</option>
                @for (p of proveedores(); track p.id) {
                  <option [value]="p.id">{{ p.numero_identificacion }} - {{ p.nombre_completo }}</option>
                }
              </select>
            </div>

            <div class="flex items-center gap-2">
              <label class="text-slate-400">Desde:</label>
              <input type="date" [(ngModel)]="extractoDesde" (change)="cargarExtracto()" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white" />
              <label class="text-slate-400">Hasta:</label>
              <input type="date" [(ngModel)]="extractoHasta" (change)="cargarExtracto()" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white" />
            </div>

            <button
              (click)="imprimirReporte()"
              class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <span>🖨️ Imprimir Extracto</span>
            </button>
          </div>

          @if (datosExtracto()) {
            <!-- Resumen de Movimientos -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span class="text-xs text-slate-400">Total Facturado (Cargos)</span>
                <p class="text-2xl font-bold text-white mt-1">
                  {{ datosExtracto().total_cargos_facturas | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span class="text-xs text-slate-400">Total Pagado (Abonos EGR)</span>
                <p class="text-2xl font-bold text-emerald-400 mt-1">
                  {{ datosExtracto().total_abonos_pagos | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span class="text-xs text-slate-400">Saldo Final Acumulado</span>
                <p class="text-2xl font-bold text-amber-400 mt-1">
                  {{ datosExtracto().saldo_final | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>
            </div>

            <!-- Tabla de Libro Auxiliar / Extracto -->
            <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th class="py-3 px-4">Fecha</th>
                      <th class="py-3 px-4">Tipo Documento</th>
                      <th class="py-3 px-4">Referencia / Comprobante</th>
                      <th class="py-3 px-4">Concepto / Glosa</th>
                      <th class="py-3 px-4 text-right">Débito (Pago)</th>
                      <th class="py-3 px-4 text-right">Crédito (Factura)</th>
                      <th class="py-3 px-4 text-right">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60 font-mono">
                    @for (mov of datosExtracto().movimientos; track mov.id) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="py-3 px-4 text-slate-400 font-sans">{{ mov.fecha }}</td>
                        <td class="py-3 px-4 font-sans">
                          <span
                            [class]="mov.tipo === 'FACTURA_COMPRA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'"
                            class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          >
                            {{ mov.tipo === 'FACTURA_COMPRA' ? '📥 FACTURA' : '💸 PAGO EGR' }}
                          </span>
                        </td>
                        <td class="py-3 px-4 font-bold text-white">
                          {{ mov.documento_referencia }}
                          <span *ngIf="mov.comprobante" class="block text-[10px] text-slate-500 font-normal">
                            Asiento: {{ mov.comprobante }}
                          </span>
                        </td>
                        <td class="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">{{ mov.concepto }}</td>
                        <td class="py-3 px-4 text-right text-emerald-400">
                          {{ mov.debito > 0 ? (mov.debito | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right text-white">
                          {{ mov.credito > 0 ? (mov.credito | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right font-bold text-amber-400">
                          {{ mov.saldo_acumulado | currency:'COP':'symbol-narrow':'1.0-0' }}
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="py-8 text-center text-slate-500 font-sans">
                          No hay movimientos registrados para este proveedor.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ========================================================================= -->
      <!-- PESTAÑA 4: ANÁLISIS DE CARTERA POR EDADES DE VENCIMIENTO                   -->
      <!-- ========================================================================= -->
      @if (pestanaCxp() === 'edades') {
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <p class="text-xs text-slate-400">
              Antigüedad y vencimiento de saldos adeudados a proveedores distribuidos por franjas de tiempo.
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="cargarEdadesCartera()"
                class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>🔄 Recalcular</span>
              </button>
              <button
                (click)="imprimirReporte()"
                class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <span>🖨️ Imprimir Matriz</span>
              </button>
            </div>
          </div>

          @if (datosEdades()) {
            <!-- Tarjetas de Franjas -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span class="text-[11px] text-emerald-400 font-semibold">Corriente (Al Día)</span>
                <p class="text-lg font-bold text-white mt-1">
                  {{ datosEdades().totales_globales.total_corriente | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span class="text-[11px] text-amber-400 font-semibold">1 a 30 Días</span>
                <p class="text-lg font-bold text-amber-300 mt-1">
                  {{ datosEdades().totales_globales.total_1_a_30 | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span class="text-[11px] text-orange-400 font-semibold">31 a 60 Días</span>
                <p class="text-lg font-bold text-orange-300 mt-1">
                  {{ datosEdades().totales_globales.total_31_a_60 | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span class="text-[11px] text-rose-400 font-semibold">61 a 90 Días</span>
                <p class="text-lg font-bold text-rose-300 mt-1">
                  {{ datosEdades().totales_globales.total_61_a_90 | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span class="text-[11px] text-red-500 font-semibold">+90 Días (Crítico)</span>
                <p class="text-lg font-bold text-red-400 mt-1">
                  {{ datosEdades().totales_globales.total_mas_90 | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>

              <div class="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3">
                <span class="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">Total Cartera</span>
                <p class="text-lg font-bold text-white mt-1">
                  {{ datosEdades().totales_globales.total_cartera | currency:'COP':'symbol-narrow':'1.0-0' }}
                </p>
              </div>
            </div>

            <!-- Matriz Tabulada por Proveedor -->
            <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300 font-mono">
                  <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th class="py-3 px-4 font-sans text-left">Proveedor</th>
                      <th class="py-3 px-4 text-center font-sans">Facturas</th>
                      <th class="py-3 px-4 text-right text-emerald-400 font-sans">Corriente</th>
                      <th class="py-3 px-4 text-right text-amber-400 font-sans">1 - 30 d</th>
                      <th class="py-3 px-4 text-right text-orange-400 font-sans">31 - 60 d</th>
                      <th class="py-3 px-4 text-right text-rose-400 font-sans">61 - 90 d</th>
                      <th class="py-3 px-4 text-right text-red-400 font-sans">+90 d</th>
                      <th class="py-3 px-4 text-right text-white font-bold font-sans">Total Deuda</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    @for (prov of datosEdades().proveedores; track prov.proveedor_id) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="py-3 px-4 font-sans">
                          <span class="font-bold text-white block">{{ prov.nombre_completo }}</span>
                          <span class="text-[10px] text-slate-500 font-mono">NIT: {{ prov.numero_identificacion }}{{ prov.dv !== null ? '-' + prov.dv : '' }}</span>
                        </td>
                        <td class="py-3 px-4 text-center text-slate-400">{{ prov.facturas_abiertas }}</td>
                        <td class="py-3 px-4 text-right text-emerald-300">
                          {{ prov.corriente > 0 ? (prov.corriente | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right text-amber-300">
                          {{ prov.dias_1_30 > 0 ? (prov.dias_1_30 | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right text-orange-300">
                          {{ prov.dias_31_60 > 0 ? (prov.dias_31_60 | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right text-rose-300">
                          {{ prov.dias_61_90 > 0 ? (prov.dias_61_90 | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right text-red-400 font-bold">
                          {{ prov.dias_mas_90 > 0 ? (prov.dias_mas_90 | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                        </td>
                        <td class="py-3 px-4 text-right font-bold text-white text-sm">
                          {{ prov.total_proveedor | currency:'COP':'symbol-narrow':'1.0-0' }}
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="py-8 text-center text-slate-500 font-sans">
                          No existen saldos pendientes de pago a proveedores.
                        </td>
                      </tr>
                    }
                  </tbody>
                  <!-- Fila de Totales -->
                  <tfoot class="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                    <tr>
                      <td class="py-3 px-4 font-sans">TOTALES CONSOLIDADOS</td>
                      <td class="py-3 px-4 text-center">{{ datosEdades().proveedores.length }} prov.</td>
                      <td class="py-3 px-4 text-right text-emerald-400">
                        {{ datosEdades().totales_globales.total_corriente | currency:'COP':'symbol-narrow':'1.0-0' }}
                      </td>
                      <td class="py-3 px-4 text-right text-amber-400">
                        {{ datosEdades().totales_globales.total_1_a_30 | currency:'COP':'symbol-narrow':'1.0-0' }}
                      </td>
                      <td class="py-3 px-4 text-right text-orange-400">
                        {{ datosEdades().totales_globales.total_31_a_60 | currency:'COP':'symbol-narrow':'1.0-0' }}
                      </td>
                      <td class="py-3 px-4 text-right text-rose-400">
                        {{ datosEdades().totales_globales.total_61_a_90 | currency:'COP':'symbol-narrow':'1.0-0' }}
                      </td>
                      <td class="py-3 px-4 text-right text-red-400">
                        {{ datosEdades().totales_globales.total_mas_90 | currency:'COP':'symbol-narrow':'1.0-0' }}
                      </td>
                      <td class="py-3 px-4 text-right text-indigo-400 text-sm">
                        {{ datosEdades().totales_globales.total_cartera | currency:'COP':'symbol-narrow':'1.0-0' }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          }
        </div>
      }

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
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-300">Cuenta de Banco o Caja (Desembolso) *</label>
                <button
                  type="button"
                  (click)="abrirModalCrearBanco()"
                  class="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>+</span>
                  <span>Crear Banco / Caja</span>
                </button>
              </div>

              @if (bancoSeleccionado(); as b) {
                <div class="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex items-center justify-between transition">
                  <div class="flex items-center gap-2.5">
                    <span class="text-lg">🏦</span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono font-bold text-indigo-400 text-xs">{{ b.codigo }}</span>
                        <span class="font-medium text-white text-xs">{{ b.nombre }}</span>
                      </div>
                      <span class="text-[10px] text-slate-500">Cuenta Auxiliar PUC • Clase Activo</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="mostrarLookupBanco.set(true)"
                    class="px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition cursor-pointer"
                  >
                    🔍 Cambiar
                  </button>
                </div>
              } @else {
                <button
                  type="button"
                  (click)="mostrarLookupBanco.set(true)"
                  class="w-full bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-base text-slate-500 group-hover:text-indigo-400">🔍</span>
                    <span class="text-xs text-slate-400 group-hover:text-white font-medium">Seleccionar Cuenta de Banco o Caja...</span>
                  </div>
                  <span class="text-[10px] bg-slate-900 text-slate-400 group-hover:text-indigo-300 border border-slate-800 px-2 py-0.5 rounded">Catálogo PUC</span>
                </button>
              }
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
                  <option value="">-- Seleccionar Medio de Pago --</option>
                  <option *ngFor="let m of metodosPago()" [value]="m.codigo">
                    {{ m.nombre }} {{ m.codigo_dian ? ('(DIAN ' + m.codigo_dian + ')') : '' }}
                  </option>
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
                  <th class="py-2.5 px-3">Comprobante EGR</th>
                  <th class="py-2.5 px-3 text-right">Monto</th>
                  <th class="py-2.5 px-3 text-center">Estado</th>
                  <th class="py-2.5 px-3 text-right">Acciones</th>
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
                  <td class="py-2.5 px-3 text-center">
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      [class]="p.estado === 'ANULADO' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'"
                    >
                      {{ p.estado || 'APLICADO' }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                    <button
                      type="button"
                      (click)="abrirModalImprimirEgreso(p)"
                      class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                      title="Imprimir Comprobante de Egreso (EGR)"
                    >
                      <span>🖨️</span>
                      <span>Ver EGR</span>
                    </button>
                    @if (p.estado !== 'ANULADO') {
                      <button
                        type="button"
                        (click)="anularPago(p)"
                        class="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded border border-rose-500/30 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 transition"
                        title="Anular formalmente este pago (revierte saldo de factura y comprobante EGR)"
                      >
                        <span>🚫</span>
                        <span>Anular</span>
                      </button>
                    }
                  </td>
                </tr>
                <tr *ngIf="historialPagos()?.length === 0">
                  <td colspan="6" class="py-6 text-center text-slate-500">
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

      <!-- Modal Imprimible Formal para Documentos CxP (CAU / EGR) -->
      @if (documentoCxpParaImprimir(); as doc) {
        <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white text-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            <!-- Barra superior no imprimible -->
            <div class="bg-slate-900 px-6 py-4 flex items-center justify-between print:hidden border-b border-slate-800">
              <div class="flex items-center gap-3">
                <span class="text-xl">🖨️</span>
                <div>
                  <h3 class="text-sm font-bold text-white tracking-wide uppercase">{{ doc.titulo }}</h3>
                  <p class="text-[11px] text-slate-400 font-mono">{{ doc.consecutivo }} - Soporte Contable Oficial</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="imprimirReporte()"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>🖨️</span>
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  (click)="documentoCxpParaImprimir.set(null)"
                  class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <!-- Contenedor Membretado Impreso -->
            <div class="p-8 sm:p-10 space-y-6 text-xs bg-white text-slate-900">
              <!-- Encabezado -->
              <div class="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div class="space-y-1">
                  <h1 class="text-xl font-black text-slate-900 tracking-tight">
                    {{ authService.empresaActiva()?.razon_social || 'PACYOLO S.A.S.' }}
                  </h1>
                  <p class="font-mono text-xs text-slate-700 font-bold">
                    NIT: {{ authService.empresaActiva()?.nit || '900.123.456-7' }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    Sistema Integrado de Contabilidad & Cuentas por Pagar
                  </p>
                </div>

                <div class="text-right">
                  <div class="inline-block border-2 border-slate-900 rounded-xl p-3 bg-slate-50">
                    <span class="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">{{ doc.etiqueta }}</span>
                    <span class="text-base font-black font-mono text-slate-900">{{ doc.consecutivo }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1 font-mono">Fecha: {{ doc.fecha }}</p>
                </div>
              </div>

              @if (doc.estado === 'ANULADO') {
                <div class="border-2 border-dashed border-rose-600 bg-rose-50 text-rose-700 font-black text-center py-2.5 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  <span>COMPROBANTE DE EGRESO ANULADO — REVERTIDO EN BANCOS Y CXP</span>
                  <span>⚠️</span>
                </div>
              }

              <!-- Beneficiario / Proveedor -->
              <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span class="block text-[10px] font-bold uppercase text-slate-500">Proveedor / Beneficiario</span>
                  <p class="font-bold text-slate-900 text-sm">{{ doc.proveedor?.nombre_completo || 'Tercero' }}</p>
                  <p class="font-mono text-[11px] text-slate-600">NIT / C.C.: {{ doc.proveedor?.numero_identificacion || 'N/A' }}</p>
                </div>
                <div class="text-right space-y-0.5">
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Factura de Referencia:</span>
                    <span class="font-mono font-bold text-slate-800 ml-1">{{ doc.numeroFactura }}</span>
                  </div>
                  @if (doc.asientoContable) {
                    <div>
                      <span class="text-[10px] font-bold uppercase text-slate-500">Comprobante Contable:</span>
                      <span class="font-mono font-bold text-indigo-700 ml-1">{{ doc.asientoContable }}</span>
                    </div>
                  }
                  @if (doc.fechaVencimiento) {
                    <div>
                      <span class="text-[10px] font-bold uppercase text-slate-500">Vencimiento:</span>
                      <span class="font-mono text-slate-700 ml-1">{{ doc.fechaVencimiento }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Resumen Comercial de la Operación -->
              <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div class="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex justify-between items-center">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-700">Resumen de Liquidación Documental</span>
                  <span class="text-[10px] font-mono font-bold" [class]="doc.saldoPendiente > 0 ? 'text-amber-700' : 'text-emerald-700'">
                    {{ doc.saldoPendiente > 0 ? 'CARTERA PENDIENTE' : 'CANCELADA TOTAL' }}
                  </span>
                </div>
                <div class="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span class="block text-[10px] uppercase text-slate-500">Base / Subtotal</span>
                    <span class="font-mono font-bold text-slate-800">{{ doc.subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] uppercase text-slate-500">Impuestos / Retenciones</span>
                    <span class="font-mono font-bold text-slate-800">{{ doc.impuestos | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] uppercase text-slate-500">Valor Total Factura</span>
                    <span class="font-mono font-bold text-slate-900">{{ doc.total | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] uppercase text-slate-500">{{ doc.tipo === 'EGRESO' ? 'Monto Pagado' : 'Saldo Pendiente' }}</span>
                    <span class="font-mono font-bold" [class]="doc.tipo === 'EGRESO' ? 'text-emerald-700' : 'text-amber-700'">
                      {{ (doc.tipo === 'EGRESO' ? doc.montoPagado : doc.saldoPendiente) | currency:'COP':'symbol-narrow':'1.0-0' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- ASIENTO CONTABLE OFICIAL DE PARTIDA DOBLE (CUENTAS PUC & TERCEROS) -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>📑</span>
                    <span>Registro Contable de Partida Doble (Cuentas PUC & Terceros)</span>
                  </h4>
                  @if (doc.totalDebito > 0 && doc.totalDebito === doc.totalCredito) {
                    <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      ✓ Asiento Cuadrado al Centavo
                    </span>
                  }
                </div>

                <div class="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead class="bg-slate-100 border-b-2 border-slate-300 font-mono text-[10px] uppercase text-slate-700">
                      <tr>
                        <th class="p-2.5">Código PUC</th>
                        <th class="p-2.5">Cuenta Contable</th>
                        <th class="p-2.5">Tercero / Identificación</th>
                        <th class="p-2.5">Detalle / Concepto</th>
                        <th class="p-2.5 text-right">Débito ($)</th>
                        <th class="p-2.5 text-right">Crédito ($)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-mono text-[11px]">
                      @for (lin of doc.lineasContables; track lin.id || $index) {
                        <tr class="hover:bg-slate-50 transition">
                          <td class="p-2.5 font-bold text-slate-900">{{ lin.cuenta?.codigo || 'N/A' }}</td>
                          <td class="p-2.5 font-sans font-medium text-slate-800">{{ lin.cuenta?.nombre || lin.glosa_detalle }}</td>
                          <td class="p-2.5 text-slate-600 font-sans text-[10px]">
                            <span class="font-mono font-semibold">{{ lin.tercero?.numero_identificacion || doc.proveedor?.numero_identificacion || '' }}</span>
                            <span class="block text-slate-500 truncate max-w-[140px]">{{ lin.tercero?.nombre_completo || doc.proveedor?.nombre_completo || '' }}</span>
                          </td>
                          <td class="p-2.5 text-slate-600 font-sans text-[11px] truncate max-w-[160px]">{{ lin.glosa_detalle || doc.glosa }}</td>
                          <td class="p-2.5 text-right font-bold" [class.text-slate-900]="lin.debito > 0" [class.text-slate-400]="lin.debito <= 0">
                            {{ lin.debito > 0 ? (lin.debito | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                          </td>
                          <td class="p-2.5 text-right font-bold" [class.text-slate-900]="lin.credito > 0" [class.text-slate-400]="lin.credito <= 0">
                            {{ lin.credito > 0 ? (lin.credito | currency:'COP':'symbol-narrow':'1.0-0') : '-' }}
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="6" class="p-6 text-center text-slate-500 font-sans">
                            Cargando partidas contables oficiales del comprobante...
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-slate-100 border-t-2 border-slate-900 font-mono font-bold text-xs">
                      <tr>
                        <td colspan="4" class="p-2.5 text-right uppercase text-slate-900">Sumas Iguales:</td>
                        <td class="p-2.5 text-right text-sm text-slate-900">{{ doc.totalDebito | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                        <td class="p-2.5 text-right text-sm text-slate-900">{{ doc.totalCredito | currency:'COP':'symbol-narrow':'1.0-0' }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              @if (doc.tipo === 'EGRESO') {
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
                  <div>
                    <span class="text-[10px] font-bold uppercase text-slate-500">Método de Desembolso:</span>
                    <span class="font-bold text-slate-800 ml-1">{{ doc.metodoPago }}</span>
                  </div>
                  @if (doc.referencia) {
                    <div>
                      <span class="text-[10px] font-bold uppercase text-slate-500">Referencia Bancaria:</span>
                      <span class="font-mono font-bold text-slate-800 ml-1">{{ doc.referencia }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Firmas y Pistas de Auditoría -->
              <div class="pt-8 grid grid-cols-3 gap-6 text-center text-xs font-mono">
                <div class="border-t border-slate-400 pt-2">
                  <p class="font-bold text-slate-800">Elaboró / Causó</p>
                  <p class="text-[10px] text-slate-500">{{ authService.usuario()?.nombres || 'Usuario Autorizado' }}</p>
                </div>
                <div class="border-t border-slate-400 pt-2">
                  <p class="font-bold text-slate-800">Revisó / Auditoría</p>
                  <p class="text-[10px] text-slate-500">Control Financiero</p>
                </div>
                <div class="border-t border-slate-400 pt-2">
                  <p class="font-bold text-slate-800">Aprobó / Tesorería</p>
                  <p class="text-[10px] text-slate-500">Gerencia / Revisoría Fiscal</p>
                </div>
              </div>

              <!-- Pie Legal -->
              <div class="text-[9px] text-slate-400 border-t border-slate-200 pt-3 flex justify-between font-mono">
                <span>Generado por PACYOLO Cloud ERP | Módulo de Cuentas por Pagar (CxP)</span>
                <span>Pista de Auditoría: {{ doc.fecha }} | Ref: {{ doc.consecutivo }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Búsqueda Avanzada de Cuentas de Banco / Caja (Lookup Modal) -->
      @if (mostrarLookupBanco()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">🏦</span>
                <div>
                  <h3 class="text-base font-bold text-white">Seleccionar Cuenta de Banco o Caja</h3>
                  <p class="text-xs text-slate-400">Cuentas auxiliares autorizadas para desembolsos (PUC 1105 / 1110)</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="abrirModalCrearBanco()"
                  class="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1"
                >
                  <span>+</span>
                  <span>Nueva Cuenta</span>
                </button>
                <button
                  type="button"
                  (click)="mostrarLookupBanco.set(false)"
                  class="text-slate-400 hover:text-white text-2xl font-bold px-1"
                >&times;</button>
              </div>
            </div>

            <!-- Buscador -->
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="busquedaBanco"
                placeholder="Buscar por código (ej. 1110) o nombre de banco/caja..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autofocus
              />
              <span class="absolute left-3 top-3 text-slate-500 text-xs">🔍</span>
            </div>

            <!-- Tabla de Cuentas Bancarias / Caja -->
            <div class="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-950 font-mono text-[10px] uppercase text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th class="p-2.5">Código PUC</th>
                    <th class="p-2.5">Nombre de la Cuenta</th>
                    <th class="p-2.5">Tipo</th>
                    <th class="p-2.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  @for (b of bancosFiltrados(); track b.id) {
                    <tr
                      (click)="seleccionarBanco(b)"
                      class="hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      <td class="p-2.5 font-mono font-bold text-indigo-400">{{ b.codigo }}</td>
                      <td class="p-2.5 font-medium text-white">{{ b.nombre }}</td>
                      <td class="p-2.5">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          [class]="b.codigo.startsWith('1110') ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
                        >
                          {{ b.codigo.startsWith('1110') ? 'Banco' : 'Caja' }}
                        </span>
                      </td>
                      <td class="p-2.5 text-right">
                        <button
                          type="button"
                          (click)="seleccionarBanco(b)"
                          class="px-2.5 py-1 text-[11px] font-bold text-indigo-400 group-hover:text-white bg-indigo-500/10 group-hover:bg-indigo-600 rounded-lg transition cursor-pointer"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="p-6 text-center text-slate-500 text-xs">
                        No se encontraron cuentas de banco o caja coincidentes.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="button"
                (click)="mostrarLookupBanco.set(false)"
                class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal para Crear Nueva Cuenta Bancaria / Caja -->
      @if (mostrarModalCrearBanco()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">🏦</span>
                <div>
                  <h3 class="text-base font-bold text-white">Nueva Cuenta Bancaria o Caja</h3>
                  <p class="text-xs text-slate-400">Registrar en el Plan Único de Cuentas (PUC) NIIF</p>
                </div>
              </div>
              <button
                type="button"
                (click)="mostrarModalCrearBanco.set(false)"
                class="text-slate-400 hover:text-white text-2xl font-bold px-1"
              >&times;</button>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Cuenta *</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    (click)="cambiarTipoCreacionBanco('BANCO')"
                    [class]="tipoCreacionBanco === 'BANCO' ? 'bg-indigo-600 text-white font-bold border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'"
                    class="py-2 px-3 rounded-xl border text-center transition cursor-pointer"
                  >
                    🏦 Banco (1110)
                  </button>
                  <button
                    type="button"
                    (click)="cambiarTipoCreacionBanco('CAJA_GENERAL')"
                    [class]="tipoCreacionBanco === 'CAJA_GENERAL' ? 'bg-indigo-600 text-white font-bold border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'"
                    class="py-2 px-3 rounded-xl border text-center transition cursor-pointer"
                  >
                    💵 Caja General (110505)
                  </button>
                  <button
                    type="button"
                    (click)="cambiarTipoCreacionBanco('CAJA_MENOR')"
                    [class]="tipoCreacionBanco === 'CAJA_MENOR' ? 'bg-indigo-600 text-white font-bold border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'"
                    class="py-2 px-3 rounded-xl border text-center transition cursor-pointer"
                  >
                    📦 Caja Menor (110510)
                  </button>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Código Contable PUC (8 Dígitos) *</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoBancoForm.codigo"
                  placeholder="Ej: 11100503"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
                <span class="text-[10px] text-slate-500 mt-1 block">Código sugerido automáticamente según las cuentas existentes.</span>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Nombre Descriptivo de la Cuenta *</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoBancoForm.nombre"
                  placeholder="Ej: Bancolombia Cta Ahorros #4582 / Davivienda Corriente"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                (click)="mostrarModalCrearBanco.set(false)"
                class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="guardarNuevoBanco()"
                [disabled]="guardandoBanco() || !nuevoBancoForm.codigo || !nuevoBancoForm.nombre"
                class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                @if (guardandoBanco()) {
                  <span class="inline-block animate-spin">⏳</span>
                  <span>Guardando...</span>
                } @else {
                  <span>✓</span>
                  <span>Crear y Seleccionar</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CxpAdminComponent implements OnInit {
  pestanaCxp = signal<'facturas' | 'estado_cuenta' | 'extracto' | 'edades'>('facturas');
  facturas = signal<CuentaPorPagarItem[]>([]);
  cartera = signal<ResumenCartera | null>(null);
  proveedores = signal<ProveedorItem[]>([]);
  conceptos = signal<ConceptoMapeo[]>([]);
  cuentasBanco = signal<CuentaBancoItem[]>([]);
  mostrarLookupBanco = signal<boolean>(false);
  mostrarModalCrearBanco = signal<boolean>(false);
  guardandoBanco = signal<boolean>(false);
  busquedaBanco = '';
  tipoCreacionBanco: 'BANCO' | 'CAJA_GENERAL' | 'CAJA_MENOR' = 'BANCO';
  nuevoBancoForm = {
    codigo: '',
    nombre: '',
  };

  metodosPago = signal<ParametroItem[]>([]);

  // Búsqueda y Visor Documental
  busquedaFactura = '';
  readonly documentoCxpParaImprimir = signal<any | null>(null);

  // Señales de Reportes Analíticos
  proveedorSeleccionadoEstado = '';
  datosEstadoCuenta = signal<any | null>(null);

  proveedorSeleccionadoExtracto = '';
  extractoDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  extractoHasta = new Date().toISOString().slice(0, 10);
  datosExtracto = signal<any | null>(null);

  datosEdades = signal<any | null>(null);

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
  readonly authService = inject(AuthService);
  private parametrosService = inject(ParametrosService);
  private notificationService = inject(NotificationService);

  // Filtros reactivos
  facturasFiltradas(): CuentaPorPagarItem[] {
    const q = this.busquedaFactura.toLowerCase().trim();
    if (!q) return this.facturas();
    return this.facturas().filter((f) => {
      return (
        (f.numero_factura_proveedor && f.numero_factura_proveedor.toLowerCase().includes(q)) ||
        (f.tercero?.nombre_completo && f.tercero.nombre_completo.toLowerCase().includes(q)) ||
        (f.tercero?.numero_identificacion && f.tercero.numero_identificacion.toLowerCase().includes(q)) ||
        (f.asiento?.numero_comprobante && f.asiento.numero_comprobante.toLowerCase().includes(q))
      );
    });
  }

  abrirModalImprimirCausacion(cxp: CuentaPorPagarItem): void {
    const asignarDoc = (item: CuentaPorPagarItem) => {
      const lineas = item.asiento?.lineas || [];
      const totalDeb = lineas.reduce((acc, l) => acc + Number(l.debito || 0), 0);
      const totalCred = lineas.reduce((acc, l) => acc + Number(l.credito || 0), 0);

      this.documentoCxpParaImprimir.set({
        tipo: 'CAUSACION',
        titulo: 'COMPROBANTE FORMAL DE CAUSACIÓN CONTABLE (CAU)',
        etiqueta: 'COMPROBANTE CAU',
        consecutivo: item.asiento?.numero_comprobante || `CAU-${item.numero_factura_proveedor}`,
        fecha: item.fecha_emision,
        numeroFactura: item.numero_factura_proveedor,
        fechaVencimiento: item.fecha_vencimiento,
        asientoContable: item.asiento?.numero_comprobante,
        proveedor: item.tercero,
        glosa: item.glosa || `Causación de Factura de Proveedor ${item.numero_factura_proveedor}`,
        subtotal: item.subtotal,
        impuestos: item.total_impuestos,
        total: item.total_factura,
        saldoPendiente: item.saldo_pendiente,
        lineasContables: lineas,
        totalDebito: totalDeb > 0 ? totalDeb : item.total_factura,
        totalCredito: totalCred > 0 ? totalCred : item.total_factura,
      });
    };

    if (cxp.asiento?.lineas && cxp.asiento.lineas.length > 0) {
      asignarDoc(cxp);
    } else {
      this.http.get<CuentaPorPagarItem>(`http://localhost:3000/api/v1/cxp/${cxp.id}`).subscribe({
        next: (completa) => asignarDoc(completa),
        error: () => asignarDoc(cxp),
      });
    }
  }

  abrirModalImprimirEgreso(pago: PagoHistorial): void {
    const fac = this.facturaAPagar();
    const lineas = pago.asiento?.lineas || [];
    const totalDeb = lineas.reduce((acc, l) => acc + Number(l.debito || 0), 0);
    const totalCred = lineas.reduce((acc, l) => acc + Number(l.credito || 0), 0);

    const proveedor = (pago as any).cuenta_por_pagar?.tercero || fac?.tercero;
    const numFactura = (pago as any).cuenta_por_pagar?.numero_factura_proveedor || fac?.numero_factura_proveedor || 'N/A';

    this.documentoCxpParaImprimir.set({
      tipo: 'EGRESO',
      titulo: 'COMPROBANTE FORMAL DE EGRESO BANCARIO (EGR)',
      etiqueta: 'COMPROBANTE EGR',
      consecutivo: pago.asiento?.numero_comprobante || 'EGR-PAGO',
      fecha: pago.fecha_pago,
      numeroFactura: numFactura,
      asientoContable: pago.asiento?.numero_comprobante,
      proveedor: proveedor,
      glosa: pago.glosa || `Pago realizado a Factura ${numFactura}`,
      subtotal: fac?.subtotal || pago.monto_pago,
      impuestos: fac?.total_impuestos || 0,
      total: fac?.total_factura || (pago as any).cuenta_por_pagar?.monto_total || pago.monto_pago,
      montoPagado: pago.monto_pago,
      metodoPago: pago.metodo_pago,
      referencia: pago.referencia_transaccion,
      lineasContables: lineas,
      totalDebito: totalDeb > 0 ? totalDeb : pago.monto_pago,
      totalCredito: totalCred > 0 ? totalCred : pago.monto_pago,
      estado: pago.estado || 'APLICADO',
    });
  }

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

    this.cargarBancos();

    // Métodos de Pago dinámicos
    this.parametrosService.obtenerMetodosPago().subscribe({
      next: (data) => {
        const activos = data.filter((d) => d.activo);
        this.metodosPago.set(activos);
        if (activos.length > 0 && !this.nuevoPago.metodo_pago) {
          this.nuevoPago.metodo_pago = activos[0].codigo;
        }
      },
      error: (err) => console.error('Error cargando métodos de pago:', err),
    });
  }

  sembrarConceptos(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .post(`http://localhost:3000/api/v1/mapeo-conceptos/sembrar/${emp.empresa_id}`, {})
      .subscribe({
        next: () => {
          this.notificationService.success('¡Catálogo estándar de conceptos operativos sembrado con éxito!');
          this.cargarDatos();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Error al sembrar conceptos.'),
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

    const user = this.authService.usuario();
    const payload = {
      empresa_id: emp.empresa_id,
      cuenta_por_pagar_id: factura.id,
      cuenta_banco_id: this.nuevoPago.cuenta_banco_id,
      monto_pago: Number(this.nuevoPago.monto_pago),
      fecha_pago: this.nuevoPago.fecha_pago,
      metodo_pago: this.nuevoPago.metodo_pago,
      referencia_transaccion: this.nuevoPago.referencia_transaccion.trim() || undefined,
      glosa: `Pago factura ${factura.numero_factura_proveedor}`,
      usuario_id: user?.id,
      creado_por: user?.email,
    };

    this.http.post('http://localhost:3000/api/v1/cxp/pagar', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.facturaAPagar.set(null);
        this.notificationService.success('Pago registrado y comprobante de egreso generado con éxito.');
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.notificationService.error(err.error?.message || 'Error registrando el pago.');
      },
    });
  }

  verHistorialPagos(cxp: CuentaPorPagarItem): void {
    this.facturaAPagar.set(cxp);
    this.http.get<PagoHistorial[]>(`http://localhost:3000/api/v1/cxp/${cxp.id}/pagos`).subscribe({
      next: (data) => this.historialPagos.set(data),
      error: (err) => console.error('Error cargando historial de pagos:', err),
    });
  }

  anularPago(pago: PagoHistorial): void {
    const fac = this.facturaAPagar();
    const facInfo = fac ? ` de la Factura ${fac.numero_factura_proveedor}` : '';
    this.notificationService
      .confirm({
        title: 'Confirmar Anulación de Pago',
        message: `¿Está seguro de ANULAR este pago por valor de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(pago.monto_pago)}${facInfo}? Se revertirá automáticamente el saldo de la cuenta por pagar y se anulará formalmente el Comprobante de Egreso ${pago.asiento?.numero_comprobante || ''}.`,
        confirmText: 'Sí, Anular Pago',
        cancelText: 'Cancelar',
        intent: 'danger',
      })
      .then((confirmado) => {
        if (!confirmado) return;

        this.guardando.set(true);
        const user = this.authService.usuario();
        const payload = {
          motivo: 'Anulación de pago solicitada por el usuario en panel CxP',
          usuario_id: user?.id,
          usuario_email: user?.email,
        };

        this.http.post(`http://localhost:3000/api/v1/cxp/pagos/${pago.id}/anular`, payload).subscribe({
          next: () => {
            this.guardando.set(false);
            this.notificationService.success(
              'Pago anulado formalmente. Saldo de factura y comprobante de egreso revertidos con éxito.',
              'Pago Anulado',
            );
            if (fac) {
              this.verHistorialPagos(fac);
            }
            this.cargarDatos();
          },
          error: (err) => {
            this.guardando.set(false);
            this.notificationService.error(err.error?.message || 'Error al anular pago.');
          },
        });
      });
  }


  cargarBancos(cb?: () => void): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;
    this.http
      .get<any[]>(`http://localhost:3000/api/v1/puc?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (cuentas) => {
          const bancos = cuentas.filter(
            (c) =>
              (c.permite_movimiento || c.nivel >= 8) &&
              (c.codigo.startsWith('1105') || c.codigo.startsWith('1110')),
          );
          this.cuentasBanco.set(bancos);
          if (cb) cb();
        },
        error: (err) => console.error('Error cargando bancos:', err),
      });
  }

  bancoSeleccionado(): CuentaBancoItem | undefined {
    return this.cuentasBanco().find((b) => b.id === this.nuevoPago.cuenta_banco_id);
  }

  bancosFiltrados(): CuentaBancoItem[] {
    const q = this.busquedaBanco.toLowerCase().trim();
    if (!q) return this.cuentasBanco();
    return this.cuentasBanco().filter(
      (b) => b.codigo.toLowerCase().includes(q) || b.nombre.toLowerCase().includes(q),
    );
  }

  seleccionarBanco(b: CuentaBancoItem): void {
    this.nuevoPago.cuenta_banco_id = b.id;
    this.mostrarLookupBanco.set(false);
  }

  abrirModalCrearBanco(): void {
    this.tipoCreacionBanco = 'BANCO';
    this.sugerirCodigoBanco('BANCO');
    this.nuevoBancoForm.nombre = '';
    this.mostrarModalCrearBanco.set(true);
  }

  cambiarTipoCreacionBanco(tipo: 'BANCO' | 'CAJA_GENERAL' | 'CAJA_MENOR'): void {
    this.tipoCreacionBanco = tipo;
    this.sugerirCodigoBanco(tipo);
  }

  sugerirCodigoBanco(tipo: 'BANCO' | 'CAJA_GENERAL' | 'CAJA_MENOR'): void {
    const prefijo = tipo === 'BANCO' ? '111005' : tipo === 'CAJA_GENERAL' ? '110505' : '110510';
    const cuentas = this.cuentasBanco().filter((c) => c.codigo.startsWith(prefijo));
    let max = 0;
    for (const c of cuentas) {
      const sufijo = parseInt(c.codigo.slice(prefijo.length), 10);
      if (!isNaN(sufijo) && sufijo > max) max = sufijo;
    }
    const siguiente = String(max + 1).padStart(2, '0');
    this.nuevoBancoForm.codigo = `${prefijo}${siguiente}`;
  }

  guardarNuevoBanco(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;
    const codigo = this.nuevoBancoForm.codigo.trim();
    const nombre = this.nuevoBancoForm.nombre.trim();
    if (!codigo || !nombre) {
      this.notificationService.error('Debe ingresar el código y el nombre de la cuenta.');
      return;
    }

    this.guardandoBanco.set(true);
    const payload = {
      empresa_id: emp.empresa_id,
      codigo,
      nombre,
      nivel: 8,
      clase: 'ACTIVO',
      naturaleza: 'DEBITO',
      permite_movimiento: true,
      exige_tercero: false,
    };

    this.http.post<any>('http://localhost:3000/api/v1/puc', payload).subscribe({
      next: (cuentaCreada) => {
        this.guardandoBanco.set(false);
        this.mostrarModalCrearBanco.set(false);
        this.mostrarLookupBanco.set(false);
        this.notificationService.success(`Cuenta contable ${codigo} - ${nombre} creada exitosamente en el PUC.`);
        this.cargarBancos(() => {
          this.nuevoPago.cuenta_banco_id = cuentaCreada.id;
        });
      },
      error: (err) => {
        this.guardandoBanco.set(false);
        this.notificationService.error(err.error?.message || 'Error al crear la cuenta bancaria en el PUC.');
      },
    });
  }

  autoSeleccionarProveedorEstado(): void {
    if (!this.proveedorSeleccionadoEstado && this.proveedores().length > 0) {
      this.proveedorSeleccionadoEstado = this.proveedores()[0].id;
      this.cargarEstadoCuenta();
    }
  }

  cargarEstadoCuenta(): void {
    const emp = this.authService.empresaActiva();
    if (!emp || !this.proveedorSeleccionadoEstado) return;

    this.http
      .get<any>(`http://localhost:3000/api/v1/cxp/reportes/estado-cuenta/${this.proveedorSeleccionadoEstado}?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.datosEstadoCuenta.set(data),
        error: (err) => console.error('Error cargando estado de cuenta:', err),
      });
  }

  autoSeleccionarProveedorExtracto(): void {
    if (!this.proveedorSeleccionadoExtracto && this.proveedores().length > 0) {
      this.proveedorSeleccionadoExtracto = this.proveedores()[0].id;
      this.cargarExtracto();
    }
  }

  cargarExtracto(): void {
    const emp = this.authService.empresaActiva();
    if (!emp || !this.proveedorSeleccionadoExtracto) return;

    let url = `http://localhost:3000/api/v1/cxp/reportes/extracto/${this.proveedorSeleccionadoExtracto}?empresa_id=${emp.empresa_id}`;
    if (this.extractoDesde) url += `&desde=${this.extractoDesde}`;
    if (this.extractoHasta) url += `&hasta=${this.extractoHasta}`;

    this.http.get<any>(url).subscribe({
      next: (data) => this.datosExtracto.set(data),
      error: (err) => console.error('Error cargando extracto:', err),
    });
  }

  cargarEdadesCartera(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<any>(`http://localhost:3000/api/v1/cxp/reportes/edades-cartera?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.datosEdades.set(data),
        error: (err) => console.error('Error cargando edades cartera:', err),
      });
  }

  imprimirReporte(): void {
    window.print();
  }
}
