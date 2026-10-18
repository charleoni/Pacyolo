import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import {
  ParametrosService,
  ParametroItem,
  DepartamentoItem,
  MunicipioItem,
} from '../../../core/services/parametros.service';

export interface Tercero {
  id: string;
  tipo_persona: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  digito_verificacion?: number | null;
  nombre_completo: string;
  primer_nombre?: string | null;
  otros_nombres?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  razon_social?: string | null;
  email?: string;
  telefono?: string;
  direccion?: string;
  pais_codigo?: string;
  departamento_codigo?: string | null;
  departamento_nombre?: string | null;
  codigo_municipio?: string | null;
  ciudad_nombre?: string | null;
  codigo_postal?: string | null;
  regimen_iva: string;
  responsabilidades_fiscales?: string | null;
  actividad_economica_ciiu?: string | null;
  banco_nombre?: string | null;
  tipo_cuenta_bancaria?: string | null;
  numero_cuenta_bancaria?: string | null;
  es_gran_contribuyente: boolean;
  es_autorretenedor: boolean;
  es_cliente: boolean;
  es_proveedor: boolean;
  es_empleado: boolean;
  activo: boolean;
  created_at: string;
}

@Component({
  selector: 'app-terceros-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado con Flujo Dual -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📇</span>
            Directorio de Terceros NIIF & DIAN
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Gestión integral de Clientes, Proveedores y Empleados con geografía DANE y perfil tributario
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Botón Creación Rápida (Mostrador / POS) -->
          <button
            type="button"
            (click)="abrirModalRapido()"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer shadow"
            title="Registro ágil para mostrador en caliente"
          >
            <span>⚡</span>
            + Registro Rápido
          </button>

          <!-- Botón Ficha Completa -->
          <button
            type="button"
            (click)="abrirModalFichaNueva()"
            class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            + Ficha Integral
          </button>
        </div>
      </div>

      <!-- Filtros de búsqueda y clasificación -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex items-center gap-2 flex-1 min-w-[280px]">
          <span class="text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            [(ngModel)]="busqueda"
            placeholder="Buscar por documento, nombre o ciudad..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Filtros por Rol Comercial -->
        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            (click)="filtroTipo = 'TODOS'"
            [class]="filtroTipo === 'TODOS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
          >
            Todos
          </button>
          <button
            type="button"
            (click)="filtroTipo = 'CLIENTES'"
            [class]="filtroTipo === 'CLIENTES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
          >
            Clientes
          </button>
          <button
            type="button"
            (click)="filtroTipo = 'PROVEEDORES'"
            [class]="filtroTipo === 'PROVEEDORES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
          >
            Proveedores
          </button>
          <button
            type="button"
            (click)="filtroTipo = 'EMPLEADOS'"
            [class]="filtroTipo === 'EMPLEADOS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
            class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
          >
            Empleados
          </button>
        </div>
      </div>

      <!-- Tabla de Terceros -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Documento / NIT</th>
                <th class="py-3 px-4">Nombre / Razón Social</th>
                <th class="py-3 px-4">Tipo & Régimen</th>
                <th class="py-3 px-4">Ubicación DANE</th>
                <th class="py-3 px-4">Roles de Negocio</th>
                <th class="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr *ngFor="let t of tercerosFiltrados()" class="hover:bg-slate-800/40 transition">
                <td class="py-3 px-4">
                  <div class="font-mono text-white font-semibold">
                    {{ t.tipo_identificacion }}: {{ t.numero_identificacion }}
                    <span *ngIf="t.digito_verificacion !== null && t.digito_verificacion !== undefined" class="text-indigo-400">
                      - {{ t.digito_verificacion }}
                    </span>
                  </div>
                  <div *ngIf="t.actividad_economica_ciiu" class="text-[10px] text-slate-400 font-mono mt-0.5">
                    CIIU: {{ t.actividad_economica_ciiu }}
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-bold text-white text-[13px]">{{ t.nombre_completo }}</div>
                  <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span *ngIf="t.email">✉️ {{ t.email }}</span>
                    <span *ngIf="t.telefono">📞 {{ t.telefono }}</span>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-slate-300 font-medium">
                      {{ t.tipo_persona === 'JURIDICA' ? '🏢 Persona Jurídica' : '👤 Persona Natural' }}
                    </span>
                    <span class="text-[10px] text-slate-400">
                      {{ t.regimen_iva }}
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="text-slate-200 font-medium">
                    📍 {{ t.ciudad_nombre || t.codigo_municipio || 'Bogotá, D.C.' }}
                  </div>
                  <div *ngIf="t.departamento_nombre" class="text-[10px] text-slate-400">
                    {{ t.departamento_nombre }} ({{ t.pais_codigo || 'CO' }})
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1">
                    <span *ngIf="t.es_cliente" class="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-semibold">
                      Cliente
                    </span>
                    <span *ngIf="t.es_proveedor" class="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-semibold">
                      Proveedor
                    </span>
                    <span *ngIf="t.es_empleado" class="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-semibold">
                      Empleado
                    </span>
                    <span *ngIf="t.es_gran_contribuyente" class="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-semibold">
                      Gran Contribuyente
                    </span>
                    <span *ngIf="t.es_autorretenedor" class="px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded text-[10px] font-semibold">
                      Autorretenedor
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4 text-center">
                  <button
                    type="button"
                    (click)="abrirFichaEditar(t)"
                    class="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg transition border border-slate-700 hover:border-indigo-500 inline-flex items-center gap-1 cursor-pointer"
                    title="Ver y editar ficha completa tributaria y DANE"
                  >
                    <span>📋</span>
                    Ficha Completa
                  </button>
                </td>
              </tr>
              <tr *ngIf="tercerosFiltrados().length === 0">
                <td colspan="6" class="py-8 text-center text-slate-500 italic">
                  No se encontraron terceros registrados en la empresa activa.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL 1: REGISTRO RÁPIDO (MOSTRADOR / POS)               -->
      <!-- ======================================================== -->
      <div *ngIf="mostrarModalRapido()" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>⚡</span>
              Registro Rápido de Tercero (Mostrador)
            </h3>
            <button (click)="mostrarModalRapido.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <div *ngIf="errorMsg()" class="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {{ errorMsg() }}
          </div>

          <div class="mt-4 space-y-4 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Identificación *</label>
                <select
                  [(ngModel)]="formRapido.tipo_identificacion"
                  (change)="onCambioIdentificacionRapido()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option *ngFor="let t of tiposIdentificacion()" [value]="t.codigo">
                    {{ t.codigo }} — {{ t.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Número de Documento *</label>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    [(ngModel)]="formRapido.numero_identificacion"
                    (input)="onCambioIdentificacionRapido()"
                    placeholder="Ej: 900123456"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <div *ngIf="aplicaDigitoVerificacion(formRapido.tipo_identificacion)" class="text-center min-w-[45px]">
                    <span class="block text-[10px] text-slate-400">DV</span>
                    <span class="px-2 py-1 bg-indigo-500/10 text-indigo-400 font-mono font-bold rounded border border-indigo-500/30">
                      {{ formRapido.digito_verificacion !== undefined ? formRapido.digito_verificacion : '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Nombre Completo o Razón Social *</label>
              <input
                type="text"
                [(ngModel)]="formRapido.nombre_completo"
                placeholder="Ej: DISTRIBUIDORA NACIONAL SAS o Carlos Mendoza"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Persona *</label>
                <select
                  [(ngModel)]="formRapido.tipo_persona"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option *ngFor="let tp of tiposPersona()" [value]="tp.codigo">
                    {{ tp.nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Régimen Fiscal *</label>
                <select
                  [(ngModel)]="formRapido.regimen_iva"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option *ngFor="let rf of regimenesFiscales()" [value]="rf.codigo">
                    {{ rf.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Ciudad / Municipio (DANE)</label>
                <select
                  [(ngModel)]="formRapido.codigo_municipio"
                  (change)="onMunicipioRapidoChange()"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option *ngFor="let m of municipios()" [value]="m.codigo">
                    {{ m.nombre }} ({{ m.departamento_nombre }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Teléfono / Celular</label>
                <input
                  type="text"
                  [(ngModel)]="formRapido.telefono"
                  placeholder="Ej: 3001234567"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                [(ngModel)]="formRapido.email"
                placeholder="facturacion@empresa.com"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Dirección Física</label>
              <input
                type="text"
                [(ngModel)]="formRapido.direccion"
                placeholder="Calle 100 # 15-20"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Clasificación rápida -->
            <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span class="block font-semibold text-slate-300 mb-2">Clasificación en el Negocio:</span>
              <div class="flex flex-wrap gap-4">
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" [(ngModel)]="formRapido.es_cliente" class="rounded text-indigo-600" />
                  <span>Es Cliente</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" [(ngModel)]="formRapido.es_proveedor" class="rounded text-indigo-600" />
                  <span>Es Proveedor</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" [(ngModel)]="formRapido.es_empleado" class="rounded text-indigo-600" />
                  <span>Es Empleado</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-5 mt-4 border-t border-slate-800">
            <button
              type="button"
              (click)="mostrarModalRapido.set(false)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardarTerceroRapido()"
              [disabled]="guardando() || !puedeGuardarRapido()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition"
            >
              {{ guardando() ? 'Guardando...' : 'Guardar Tercero' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- MODAL 2: FICHA COMPLETA INTEGRAL (NIIF / DIAN / DANE)    -->
      <!-- ======================================================== -->
      <div *ngIf="mostrarModalFicha()" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <!-- Encabezado Ficha -->
          <div class="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>📋</span>
                {{ esEdicion() ? 'Ficha Integral de Tercero: ' + fichaTercero.nombre_completo : 'Crear Ficha Integral de Tercero' }}
              </h3>
              <p class="text-[11px] text-slate-400">
                Información tributaria, localización DANE Divipola y datos de dispersión bancaria
              </p>
            </div>
            <button (click)="mostrarModalFicha.set(false)" class="text-slate-400 hover:text-white text-xl">✕</button>
          </div>

          <!-- Pestañas de la Ficha -->
          <div class="flex border-b border-slate-800 px-5 pt-3 gap-2 bg-slate-950/30 overflow-x-auto text-xs font-medium">
            <button
              type="button"
              (click)="pestanaFichaActiva = 'general'"
              [class]="pestanaFichaActiva === 'general' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
              class="px-4 py-2 rounded-t-xl transition whitespace-nowrap cursor-pointer"
            >
              1. General & Identificación
            </button>
            <button
              type="button"
              (click)="pestanaFichaActiva = 'ubicacion'"
              [class]="pestanaFichaActiva === 'ubicacion' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
              class="px-4 py-2 rounded-t-xl transition whitespace-nowrap cursor-pointer"
            >
              2. Ubicación DANE Divipola
            </button>
            <button
              type="button"
              (click)="pestanaFichaActiva = 'tributaria'"
              [class]="pestanaFichaActiva === 'tributaria' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
              class="px-4 py-2 rounded-t-xl transition whitespace-nowrap cursor-pointer"
            >
              3. Tributaria & DIAN (CIIU / ReteICA)
            </button>
            <button
              type="button"
              (click)="pestanaFichaActiva = 'bancaria'"
              [class]="pestanaFichaActiva === 'bancaria' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
              class="px-4 py-2 rounded-t-xl transition whitespace-nowrap cursor-pointer"
            >
              4. Datos Bancarios
            </button>
          </div>

          <!-- Contenido Pestañas -->
          <div class="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div *ngIf="errorMsg()" class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              {{ errorMsg() }}
            </div>

            <!-- PESTAÑA 1: GENERAL -->
            <div *ngIf="pestanaFichaActiva === 'general'" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Tipo Identificación *</label>
                  <select
                    [(ngModel)]="fichaTercero.tipo_identificacion"
                    (change)="onCambioIdentificacionFicha()"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option *ngFor="let t of tiposIdentificacion()" [value]="t.codigo">
                      {{ t.codigo }} — {{ t.nombre }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.numero_identificacion"
                    (input)="onCambioIdentificacionFicha()"
                    placeholder="Ej: 900123456"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Dígito Verificación (DV)</label>
                  <input
                    type="text"
                    [value]="fichaTercero.digito_verificacion !== undefined && fichaTercero.digito_verificacion !== null ? fichaTercero.digito_verificacion : '-'"
                    disabled
                    class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400 font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Tipo de Persona *</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="tipoPersonaFicha"
                      [(ngModel)]="fichaTercero.tipo_persona"
                      value="JURIDICA"
                      class="text-indigo-600"
                    />
                    <span>🏢 Persona Jurídica (Empresa / Sociedad)</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="tipoPersonaFicha"
                      [(ngModel)]="fichaTercero.tipo_persona"
                      value="NATURAL"
                      class="text-indigo-600"
                    />
                    <span>👤 Persona Natural (Individuo / Empleado)</span>
                  </label>
                </div>
              </div>

              <!-- Si es Jurídica -->
              <div *ngIf="fichaTercero.tipo_persona === 'JURIDICA'">
                <label class="block font-semibold text-slate-300 mb-1">Razón Social Oficial *</label>
                <input
                  type="text"
                  [(ngModel)]="fichaTercero.razon_social"
                  (input)="recalcularNombreCompletoFicha()"
                  placeholder="Ej: DISTRIBUIDORA NACIONAL S.A.S."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <!-- Si es Natural: Nombres y Apellidos Desglosados para DIAN -->
              <div *ngIf="fichaTercero.tipo_persona === 'NATURAL'" class="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <span class="block text-[11px] font-semibold text-indigo-400">Desglose de Nombres (Norma Exógena & Nómina DIAN):</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-slate-400 mb-1">Primer Nombre *</label>
                    <input
                      type="text"
                      [(ngModel)]="fichaTercero.primer_nombre"
                      (input)="recalcularNombreCompletoFicha()"
                      placeholder="Ej: Carlos"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Otros Nombres</label>
                    <input
                      type="text"
                      [(ngModel)]="fichaTercero.otros_nombres"
                      (input)="recalcularNombreCompletoFicha()"
                      placeholder="Ej: Andrés"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Primer Apellido *</label>
                    <input
                      type="text"
                      [(ngModel)]="fichaTercero.primer_apellido"
                      (input)="recalcularNombreCompletoFicha()"
                      placeholder="Ej: Mendoza"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Segundo Apellido</label>
                    <input
                      type="text"
                      [(ngModel)]="fichaTercero.segundo_apellido"
                      (input)="recalcularNombreCompletoFicha()"
                      placeholder="Ej: Silva"
                      class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Nombre Completo Consolidado</label>
                <input
                  type="text"
                  [(ngModel)]="fichaTercero.nombre_completo"
                  placeholder="Se autocalcula a partir de los nombres o razón social"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <!-- Roles de negocio -->
              <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span class="block font-semibold text-slate-300 mb-2">Clasificación Comercial:</span>
                <div class="flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input type="checkbox" [(ngModel)]="fichaTercero.es_cliente" class="rounded text-indigo-600" />
                    <span>Es Cliente</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input type="checkbox" [(ngModel)]="fichaTercero.es_proveedor" class="rounded text-indigo-600" />
                    <span>Es Proveedor</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input type="checkbox" [(ngModel)]="fichaTercero.es_empleado" class="rounded text-indigo-600" />
                    <span>Es Empleado</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- PESTAÑA 2: UBICACIÓN DANE -->
            <div *ngIf="pestanaFichaActiva === 'ubicacion'" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">País *</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.pais_codigo"
                    placeholder="CO"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Departamento (DANE) *</label>
                  <select
                    [(ngModel)]="fichaTercero.departamento_codigo"
                    (change)="onDepartamentoChange()"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Seleccionar Departamento --</option>
                    <option *ngFor="let d of departamentos()" [value]="d.codigo">
                      {{ d.codigo }} - {{ d.nombre }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Municipio / Ciudad (Divipola DANE) *</label>
                  <select
                    [(ngModel)]="fichaTercero.codigo_municipio"
                    (change)="onMunicipioFichaChange()"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Seleccionar Municipio --</option>
                    <option *ngFor="let m of municipiosFiltrados()" [value]="m.codigo">
                      {{ m.codigo }} - {{ m.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Dirección Física Completa *</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.direccion"
                    placeholder="Ej: Calle 100 # 15-20 Edificio Torre Norte Of. 501"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Código Postal</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.codigo_postal"
                    placeholder="Ej: 110111"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Correo Electrónico (Recepción de Facturas)</label>
                  <input
                    type="email"
                    [(ngModel)]="fichaTercero.email"
                    placeholder="facturacion@proveedor.com"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Teléfono o Celular</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.telefono"
                    placeholder="3001234567"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <!-- PESTAÑA 3: TRIBUTARIA & DIAN -->
            <div *ngIf="pestanaFichaActiva === 'tributaria'" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Régimen Fiscal / Responsabilidad IVA *</label>
                  <select
                    [(ngModel)]="fichaTercero.regimen_iva"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option *ngFor="let rf of regimenesFiscales()" [value]="rf.codigo">
                      {{ rf.codigo }} — {{ rf.nombre }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Actividad Económica Principal (Código CIIU 4 dígitos)</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.actividad_economica_ciiu"
                    placeholder="Ej: 4711, 6201, 1071 (Aplica para ReteICA municipal)"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span class="text-[10px] text-slate-400 mt-0.5 block">Requerido para la tarifa de Retención de ICA en el municipio</span>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Responsabilidades Tributarias DIAN (RUT)</label>
                <input
                  type="text"
                  [(ngModel)]="fichaTercero.responsabilidades_fiscales"
                  placeholder="Ej: O-13;O-15;O-23;R-99-PN"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div class="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span class="block font-semibold text-slate-300 mb-1">Calificaciones Tributarias Especiales:</span>
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" [(ngModel)]="fichaTercero.es_gran_contribuyente" class="rounded text-indigo-600" />
                  <span>Gran Contribuyente (Resolución DIAN)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" [(ngModel)]="fichaTercero.es_autorretenedor" class="rounded text-indigo-600" />
                  <span>Autorretenedor de Renta / IVA</span>
                </label>
              </div>
            </div>

            <!-- PESTAÑA 4: BANCARIA -->
            <div *ngIf="pestanaFichaActiva === 'bancaria'" class="space-y-4">
              <p class="text-slate-400 text-xs">
                Datos necesarios para dispersión de pagos de nómina, giros a proveedores y transferencias bancarias.
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Entidad Bancaria</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.banco_nombre"
                    placeholder="Ej: Bancolombia, Davivienda, BBVA..."
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Tipo de Cuenta</label>
                  <select
                    [(ngModel)]="fichaTercero.tipo_cuenta_bancaria"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- No especificada --</option>
                    <option value="AHORROS">Cuenta de Ahorros</option>
                    <option value="CORRIENTE">Cuenta Corriente</option>
                    <option value="BILLETERA">Billetera Digital (Nequi / Daviplata)</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    [(ngModel)]="fichaTercero.numero_cuenta_bancaria"
                    placeholder="Ej: 12345678901"
                    class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Pie de Botones Ficha -->
          <div class="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              (click)="mostrarModalFicha.set(false)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              (click)="guardarFichaCompleta()"
              [disabled]="guardando() || !puedeGuardarFicha()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition cursor-pointer"
            >
              {{ guardando() ? 'Guardando...' : (esEdicion() ? 'Actualizar Ficha Integral' : 'Guardar Ficha Integral') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TercerosAdminComponent implements OnInit {
  terceros = signal<Tercero[]>([]);
  tiposIdentificacion = signal<ParametroItem[]>([]);
  tiposPersona = signal<ParametroItem[]>([]);
  regimenesFiscales = signal<ParametroItem[]>([]);
  departamentos = signal<DepartamentoItem[]>([]);
  municipios = signal<MunicipioItem[]>([]);

  mostrarModalRapido = signal<boolean>(false);
  mostrarModalFicha = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  busqueda = '';
  filtroTipo = 'TODOS';
  pestanaFichaActiva: 'general' | 'ubicacion' | 'tributaria' | 'bancaria' = 'general';

  // Formulario Rápido (Mostrador / POS)
  formRapido = {
    tipo_persona: 'JURIDICA',
    tipo_identificacion: 'NIT',
    numero_identificacion: '',
    digito_verificacion: undefined as number | undefined,
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    codigo_municipio: '11001',
    ciudad_nombre: 'Bogotá, D.C.',
    pais_codigo: 'CO',
    regimen_iva: 'RESPONSABLE',
    es_cliente: true,
    es_proveedor: false,
    es_empleado: false,
    es_gran_contribuyente: false,
    es_autorretenedor: false,
  };

  // Formulario Ficha Integral
  fichaTercero: any = {};

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private parametrosService = inject(ParametrosService);

  ngOnInit(): void {
    this.cargarTerceros();
    this.cargarTablasMaestras();
  }

  cargarTablasMaestras(): void {
    this.parametrosService.obtenerTiposIdentificacion().subscribe({
      next: (data) => this.tiposIdentificacion.set(data.filter((d) => d.activo)),
      error: (err) => console.error('Error cargando tipos id:', err),
    });

    this.parametrosService.obtenerTiposPersona().subscribe({
      next: (data) => this.tiposPersona.set(data.filter((d) => d.activo)),
      error: (err) => console.error('Error cargando tipos persona:', err),
    });

    this.parametrosService.obtenerRegimenesFiscales().subscribe({
      next: (data) => this.regimenesFiscales.set(data.filter((d) => d.activo)),
      error: (err) => console.error('Error cargando regimenes:', err),
    });

    this.parametrosService.obtenerDepartamentos().subscribe({
      next: (data) => this.departamentos.set(data.filter((d) => d.activo)),
      error: (err) => console.error('Error cargando departamentos:', err),
    });

    this.parametrosService.buscarMunicipios().subscribe({
      next: (data) => this.municipios.set(data.filter((d) => d.activo)),
      error: (err) => console.error('Error cargando municipios:', err),
    });
  }

  cargarTerceros(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<Tercero[]>(`http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.terceros.set(data),
        error: (err) => console.error('Error cargando terceros:', err),
      });
  }

  tercerosFiltrados(): Tercero[] {
    let lista = this.terceros();

    if (this.filtroTipo === 'CLIENTES') {
      lista = lista.filter((t) => t.es_cliente);
    } else if (this.filtroTipo === 'PROVEEDORES') {
      lista = lista.filter((t) => t.es_proveedor);
    } else if (this.filtroTipo === 'EMPLEADOS') {
      lista = lista.filter((t) => t.es_empleado);
    }

    const q = this.busqueda.trim().toLowerCase();
    if (!q) return lista;

    return lista.filter(
      (t) =>
        t.numero_identificacion.toLowerCase().includes(q) ||
        t.nombre_completo.toLowerCase().includes(q) ||
        (t.ciudad_nombre && t.ciudad_nombre.toLowerCase().includes(q)),
    );
  }

  municipiosFiltrados(): MunicipioItem[] {
    const deptoCod = this.fichaTercero?.departamento_codigo;
    if (!deptoCod) return this.municipios();
    return this.municipios().filter((m) => m.departamento_codigo === deptoCod);
  }

  // CÁLCULO DV OFICIAL DIAN (MÓDULO 11)
  calcularDvDian(nit: string): number | undefined {
    const limpio = nit.replace(/\D/g, '');
    if (!limpio || limpio.length === 0) return undefined;

    const factores = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
    let suma = 0;
    const len = limpio.length;

    for (let i = 0; i < len; i++) {
      const digito = parseInt(limpio.charAt(len - 1 - i), 10);
      const factor = factores[factores.length - 1 - i];
      suma += digito * factor;
    }

    const residuo = suma % 11;
    if (residuo === 0 || residuo === 1) {
      return residuo;
    }
    return 11 - residuo;
  }

  aplicaDigitoVerificacion(tipoId: string): boolean {
    const tipo = this.tiposIdentificacion().find((t) => t.codigo === tipoId);
    return tipo?.aplica_digito_verificacion === true;
  }

  // --- CONTROL MODAL RÁPIDO ---
  abrirModalRapido(): void {
    this.formRapido = {
      tipo_persona: 'JURIDICA',
      tipo_identificacion: 'NIT',
      numero_identificacion: '',
      digito_verificacion: undefined,
      nombre_completo: '',
      email: '',
      telefono: '',
      direccion: '',
      codigo_municipio: '11001',
      ciudad_nombre: 'Bogotá, D.C.',
      pais_codigo: 'CO',
      regimen_iva: 'RESPONSABLE',
      es_cliente: true,
      es_proveedor: false,
      es_empleado: false,
      es_gran_contribuyente: false,
      es_autorretenedor: false,
    };
    this.errorMsg.set(null);
    this.mostrarModalRapido.set(true);
  }

  onCambioIdentificacionRapido(): void {
    if (this.aplicaDigitoVerificacion(this.formRapido.tipo_identificacion)) {
      this.formRapido.digito_verificacion = this.calcularDvDian(this.formRapido.numero_identificacion);
    } else {
      this.formRapido.digito_verificacion = undefined;
    }
  }

  onMunicipioRapidoChange(): void {
    const m = this.municipios().find((item) => item.codigo === this.formRapido.codigo_municipio);
    if (m) {
      this.formRapido.ciudad_nombre = m.nombre;
    }
  }

  puedeGuardarRapido(): boolean {
    return (
      this.formRapido.numero_identificacion.trim().length > 0 &&
      this.formRapido.nombre_completo.trim().length > 0
    );
  }

  guardarTerceroRapido(): void {
    if (!this.puedeGuardarRapido()) return;

    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      empresa_id: emp.empresa_id,
      ...this.formRapido,
      numero_identificacion: this.formRapido.numero_identificacion.trim(),
      nombre_completo: this.formRapido.nombre_completo.trim(),
    };

    this.http.post('http://localhost:3000/api/v1/terceros', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalRapido.set(false);
        this.cargarTerceros();
      },
      error: (err) => {
        this.guardando.set(false);
        const backendMsg = err.error?.message;
        this.errorMsg.set(Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg || 'Error guardando.');
      },
    });
  }

  // --- CONTROL MODAL FICHA INTEGRAL ---
  abrirModalFichaNueva(): void {
    this.esEdicion.set(false);
    this.pestanaFichaActiva = 'general';
    this.fichaTercero = {
      tipo_persona: 'JURIDICA',
      tipo_identificacion: 'NIT',
      numero_identificacion: '',
      digito_verificacion: undefined,
      nombre_completo: '',
      primer_nombre: '',
      otros_nombres: '',
      primer_apellido: '',
      segundo_apellido: '',
      razon_social: '',
      email: '',
      telefono: '',
      direccion: '',
      pais_codigo: 'CO',
      departamento_codigo: '11',
      departamento_nombre: 'Bogotá, D.C.',
      codigo_municipio: '11001',
      ciudad_nombre: 'Bogotá, D.C.',
      codigo_postal: '110111',
      regimen_iva: 'RESPONSABLE',
      responsabilidades_fiscales: 'O-13;O-15',
      actividad_economica_ciiu: '',
      banco_nombre: '',
      tipo_cuenta_bancaria: '',
      numero_cuenta_bancaria: '',
      es_cliente: true,
      es_proveedor: false,
      es_empleado: false,
      es_gran_contribuyente: false,
      es_autorretenedor: false,
    };
    this.errorMsg.set(null);
    this.mostrarModalFicha.set(true);
  }

  abrirFichaEditar(tercero: Tercero): void {
    this.esEdicion.set(true);
    this.pestanaFichaActiva = 'general';
    this.fichaTercero = { ...tercero };
    this.errorMsg.set(null);
    this.mostrarModalFicha.set(true);
  }

  onCambioIdentificacionFicha(): void {
    if (this.aplicaDigitoVerificacion(this.fichaTercero.tipo_identificacion)) {
      this.fichaTercero.digito_verificacion = this.calcularDvDian(this.fichaTercero.numero_identificacion || '');
    } else {
      this.fichaTercero.digito_verificacion = undefined;
    }
  }

  recalcularNombreCompletoFicha(): void {
    if (this.fichaTercero.tipo_persona === 'JURIDICA') {
      if (this.fichaTercero.razon_social) {
        this.fichaTercero.nombre_completo = this.fichaTercero.razon_social.trim();
      }
    } else {
      const parts = [
        this.fichaTercero.primer_nombre,
        this.fichaTercero.otros_nombres,
        this.fichaTercero.primer_apellido,
        this.fichaTercero.segundo_apellido,
      ]
        .filter(Boolean)
        .map((s) => s.trim());
      if (parts.length > 0) {
        this.fichaTercero.nombre_completo = parts.join(' ');
      }
    }
  }

  onDepartamentoChange(): void {
    const d = this.departamentos().find((item) => item.codigo === this.fichaTercero.departamento_codigo);
    if (d) {
      this.fichaTercero.departamento_nombre = d.nombre;
      // Seleccionar primer municipio del departamento
      const munis = this.municipiosFiltrados();
      if (munis.length > 0) {
        this.fichaTercero.codigo_municipio = munis[0].codigo;
        this.fichaTercero.ciudad_nombre = munis[0].nombre;
      }
    }
  }

  onMunicipioFichaChange(): void {
    const m = this.municipios().find((item) => item.codigo === this.fichaTercero.codigo_municipio);
    if (m) {
      this.fichaTercero.ciudad_nombre = m.nombre;
      this.fichaTercero.departamento_codigo = m.departamento_codigo;
      this.fichaTercero.departamento_nombre = m.departamento_nombre;
    }
  }

  puedeGuardarFicha(): boolean {
    return (
      (this.fichaTercero.numero_identificacion || '').trim().length > 0 &&
      (this.fichaTercero.nombre_completo || '').trim().length > 0
    );
  }

  guardarFichaCompleta(): void {
    if (!this.puedeGuardarFicha()) return;

    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      empresa_id: emp.empresa_id,
      ...this.fichaTercero,
      numero_identificacion: (this.fichaTercero.numero_identificacion || '').trim(),
      nombre_completo: (this.fichaTercero.nombre_completo || '').trim(),
    };

    const peticion$ = this.esEdicion()
      ? this.http.patch(`http://localhost:3000/api/v1/terceros/${this.fichaTercero.id}`, payload)
      : this.http.post('http://localhost:3000/api/v1/terceros', payload);

    peticion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalFicha.set(false);
        this.cargarTerceros();
      },
      error: (err) => {
        this.guardando.set(false);
        const backendMsg = err.error?.message;
        this.errorMsg.set(Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg || 'Error guardando ficha.');
      },
    });
  }
}
