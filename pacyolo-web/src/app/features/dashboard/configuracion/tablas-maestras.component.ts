import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ParametrosService,
  ParametroItem,
  DepartamentoItem,
  MunicipioItem,
} from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';

export type CatalogoTipo =
  | 'tipos-identificacion'
  | 'tipos-persona'
  | 'regimenes-fiscales'
  | 'clasificaciones-tercero'
  | 'tipos-comprobante'
  | 'metodos-pago'
  | 'departamentos-dane'
  | 'municipios-dane';

export interface CatalogoConfig {
  id: CatalogoTipo;
  grupoId: 'terceros' | 'contabilidad' | 'geografia';
  nombre: string;
  descripcion: string;
  icono: string;
  esGeografico?: boolean;
}

export interface GrupoConfig {
  id: 'terceros' | 'contabilidad' | 'geografia';
  nombre: string;
  icono: string;
  descripcion: string;
}

@Component({
  selector: 'app-tablas-maestras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado Principal del Módulo de Parámetros -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">
              ⚙️
            </span>
            Parámetros del Sistema
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Arquitectura Maestro-Detalle: configuración modular clasificada por dominios sin datos quemados
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {{ catalogos.length }} Catálogos Operativos
          </span>
        </div>
      </div>

      <!-- Layout Maestro-Detalle (2 Columnas) -->
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        <!-- COLUMNA IZQUIERDA: Sidebar de Navegación Vertical con Buscador -->
        <aside class="w-full lg:w-80 shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <!-- Buscador Rápido de Catálogos -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Explorador de Parámetros
            </label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="busquedaCatalogo"
                placeholder="Buscar parámetro (ej: iva, dian)..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <svg class="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Grupos y Sub-Opciones Verticales -->
          <div class="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            @for (grupo of grupos; track grupo.id) {
              @if (catalogosFiltradosPorGrupo(grupo.id).length > 0) {
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{{ grupo.icono }}</span>
                    <span>{{ grupo.nombre }}</span>
                  </div>

                  <div class="space-y-1">
                    @for (cat of catalogosFiltradosPorGrupo(grupo.id); track cat.id) {
                      <button
                        type="button"
                        (click)="seleccionarCatalogo(cat.id)"
                        [class]="catalogoActivo === cat.id ? 'bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'"
                        class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer group"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="text-sm shrink-0">{{ cat.icono }}</span>
                          <span class="truncate">{{ cat.nombre }}</span>
                        </div>
                        <span
                          [class]="catalogoActivo === cat.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'"
                          class="text-xs shrink-0"
                        >
                          →
                        </span>
                      </button>
                    }
                  </div>
                </div>
              }
            }

            @if (catalogosFiltrados().length === 0) {
              <div class="p-6 text-center text-xs text-slate-500">
                No se encontraron parámetros que coincidan con "{{ busquedaCatalogo }}".
              </div>
            }
          </div>
        </aside>

        <!-- COLUMNA DERECHA: Espacio de Trabajo del Catálogo Seleccionado -->
        <main class="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <!-- Encabezado del Catálogo Activo y Botones de Acción -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 uppercase font-mono tracking-wider mb-1">
                <span>{{ grupoActivo()?.icono }} {{ grupoActivo()?.nombre }}</span>
                <span>/</span>
                <span class="text-indigo-400 font-semibold">{{ configActiva()?.nombre }}</span>
              </div>
              <h3 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{{ configActiva()?.icono }}</span>
                <span>{{ configActiva()?.nombre }}</span>
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ configActiva()?.descripcion }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                (click)="sembrarDefaults()"
                class="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                title="Sincronizar semillas oficiales en base de datos"
              >
                🌱 Semillas
              </button>

              <button
                type="button"
                (click)="imprimirCatalogo()"
                class="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                title="Imprimir catálogo para soporte o auditoría"
              >
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
              </button>

              @if (!configActiva()?.esGeografico) {
                <button
                  type="button"
                  (click)="abrirModalNuevo()"
                  class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  + Nuevo Registro
                </button>
              }
            </div>
          </div>

          <!-- Barra de Filtro en Tabla Activa -->
          <div class="flex items-center justify-between gap-4">
            <div class="relative max-w-sm w-full">
              <input
                type="text"
                [(ngModel)]="filtroTabla"
                placeholder="Filtrar en esta tabla..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <svg class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <span class="text-xs text-slate-500 font-mono">
              Registros: {{ totalRegistrosActivos() }}
            </span>
          </div>

          <!-- Tabla de Datos: Catálogos Estándar Dinámicos -->
          @if (!configActiva()?.esGeografico) {
            <div id="seccion-a-imprimir" class="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-inner">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th class="py-3 px-4">Código</th>
                      <th class="py-3 px-4">Nombre / Denominación</th>
                      <th class="py-3 px-4">Parámetros DIAN / NIIF</th>
                      <th class="py-3 px-4 text-center">Ámbito</th>
                      <th class="py-3 px-4 text-center">Estado</th>
                      <th class="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    @for (item of itemsFiltrados(); track item.id) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="py-3 px-4 font-mono font-bold text-white">{{ item.codigo }}</td>
                        <td class="py-3 px-4 font-medium text-slate-200">{{ item.nombre }}</td>
                        <td class="py-3 px-4 text-slate-400 text-[11px]">
                          <span *ngIf="item.codigo_dian" class="inline-block mr-2 font-mono">
                            DIAN: <b class="text-indigo-400">{{ item.codigo_dian }}</b>
                          </span>
                          <span *ngIf="item.aplica_digito_verificacion" class="text-emerald-400 font-semibold mr-2">
                            ✓ Aplica DV
                          </span>
                          <span *ngIf="item.prefijo" class="font-mono text-slate-300 mr-2">
                            Prefijo: [{{ item.prefijo }}]
                          </span>
                          <span *ngIf="item.codigo_responsabilidad_dian" class="font-mono text-amber-400 mr-2">
                            Resp: {{ item.codigo_responsabilidad_dian }}
                          </span>
                          <span *ngIf="item.exige_referencia" class="text-cyan-400 font-medium">
                            Exige Ref
                          </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span
                            [class]="item.es_sistema ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'"
                            class="px-2 py-0.5 rounded text-[10px] font-semibold border"
                          >
                            {{ item.es_sistema ? 'Oficial DIAN' : 'Personalizado' }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-center">
                          <span
                            [class]="item.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
                            class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                          >
                            {{ item.activo ? 'Activo' : 'Inactivo' }}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          <button
                            type="button"
                            (click)="alternarEstado(item)"
                            class="px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer"
                            [class]="item.activo ? 'text-amber-400 hover:bg-amber-950/40 border-amber-800/40' : 'text-emerald-400 hover:bg-emerald-950/40 border-emerald-800/40'"
                          >
                            {{ item.activo ? 'Inactivar' : 'Reactivar' }}
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="py-12 text-center text-slate-500 text-xs">
                          No se encontraron registros en este catálogo.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Tabla de Datos: Geografía Departamentos DANE -->
          @if (catalogoActivo === 'departamentos-dane') {
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-inner">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th class="py-3 px-4">Código DANE</th>
                      <th class="py-3 px-4">Departamento</th>
                      <th class="py-3 px-4">País</th>
                      <th class="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    @for (dep of departamentosFiltrados(); track dep.id) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="py-3 px-4 font-mono font-bold text-indigo-400">{{ dep.codigo }}</td>
                        <td class="py-3 px-4 font-medium text-white">{{ dep.nombre }}</td>
                        <td class="py-3 px-4 font-mono text-slate-400">{{ dep.pais_codigo }}</td>
                        <td class="py-3 px-4 text-center">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Oficial DANE
                          </span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="py-12 text-center text-slate-500 text-xs">
                          No se encontraron departamentos.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Tabla de Datos: Geografía Municipios Divipola DANE -->
          @if (catalogoActivo === 'municipios-dane') {
            <div class="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-inner">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th class="py-3 px-4">Código DANE (5 Dígitos)</th>
                      <th class="py-3 px-4">Municipio / Ciudad</th>
                      <th class="py-3 px-4">Departamento</th>
                      <th class="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    @for (mun of municipiosFiltrados(); track mun.id) {
                      <tr class="hover:bg-slate-800/30 transition">
                        <td class="py-3 px-4 font-mono font-bold text-emerald-400">{{ mun.codigo }}</td>
                        <td class="py-3 px-4 font-medium text-white">{{ mun.nombre }}</td>
                        <td class="py-3 px-4 text-slate-300">{{ mun.departamento_nombre }} ({{ mun.departamento_codigo }})</td>
                        <td class="py-3 px-4 text-center">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Divipola DANE
                          </span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="py-12 text-center text-slate-500 text-xs">
                          No se encontraron municipios.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </main>
      </div>

      <!-- Modal de Creación de Parámetro -->
      <div *ngIf="mostrarModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400">✨</span>
              Crear Nuevo Registro en {{ configActiva()?.nombre }}
            </h3>
            <button (click)="mostrarModal.set(false)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold cursor-pointer">&times;</button>
          </div>

          <div *ngIf="errorMsg()" class="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            {{ errorMsg() }}
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Código Único (Mnemónico) *</label>
              <input
                type="text"
                [(ngModel)]="nuevoRegistro.codigo"
                placeholder="Ej: PPT o CHEQUE_GERENCIA"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Nombre / Denominación *</label>
              <input
                type="text"
                [(ngModel)]="nuevoRegistro.nombre"
                placeholder="Ej: Permiso por Protección Temporal"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Campos específicos según el catálogo -->
            <div *ngIf="catalogoActivo === 'tipos-identificacion'" class="space-y-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Código Estándar DIAN</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoRegistro.codigo_dian"
                  placeholder="Ej: 47"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <label class="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
                <input type="checkbox" [(ngModel)]="nuevoRegistro.aplica_digito_verificacion" class="rounded text-indigo-600" />
                <span>¿Aplica Dígito de Verificación (Algoritmo Módulo 11)?</span>
              </label>
            </div>

            <div *ngIf="catalogoActivo === 'tipos-comprobante'" class="space-y-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Prefijo Oficial</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoRegistro.prefijo"
                  placeholder="Ej: NC-"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div *ngIf="catalogoActivo === 'regimenes-fiscales'" class="space-y-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Código Responsabilidad DIAN</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoRegistro.codigo_responsabilidad_dian"
                  placeholder="Ej: O-47"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div *ngIf="catalogoActivo === 'metodos-pago'" class="space-y-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Código DIAN de Medio de Pago</label>
                <input
                  type="text"
                  [(ngModel)]="nuevoRegistro.codigo_dian"
                  placeholder="Ej: 47"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <label class="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
                <input type="checkbox" [(ngModel)]="nuevoRegistro.exige_referencia" class="rounded text-indigo-600" />
                <span>¿Exige número de comprobante o referencia bancaria?</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              (click)="mostrarModal.set(false)"
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardarNuevo()"
              [disabled]="guardando() || !puedeGuardar()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition cursor-pointer"
            >
              {{ guardando() ? 'Guardando...' : 'Guardar Parámetro' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TablasMaestrasComponent implements OnInit {
  catalogoActivo: CatalogoTipo = 'tipos-identificacion';
  busquedaCatalogo: string = '';
  filtroTabla: string = '';

  items = signal<ParametroItem[]>([]);
  departamentos = signal<DepartamentoItem[]>([]);
  municipios = signal<MunicipioItem[]>([]);

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  grupos: GrupoConfig[] = [
    {
      id: 'terceros',
      nombre: 'Terceros & Facturación DIAN',
      icono: '📇',
      descripcion: 'Parámetros para identificación de personas, regímenes y clasificaciones fiscales',
    },
    {
      id: 'contabilidad',
      nombre: 'Contabilidad & Tesorería',
      icono: '📊',
      descripcion: 'Tipología de comprobantes contables y medios de pago',
    },
    {
      id: 'geografia',
      nombre: 'División Política DANE',
      icono: '🗺️',
      descripcion: 'Códigos oficiales DANE para localización de terceros y retenciones',
    },
  ];

  catalogos: CatalogoConfig[] = [
    {
      id: 'tipos-identificacion',
      grupoId: 'terceros',
      nombre: 'Tipos de Identificación',
      descripcion: 'Catálogo de documentos de identidad oficiales DIAN (CC, NIT, Pasaporte, etc.)',
      icono: '🪪',
    },
    {
      id: 'tipos-persona',
      grupoId: 'terceros',
      nombre: 'Tipos de Persona',
      descripcion: 'Clasificación jurídica (Persona Natural, Persona Jurídica)',
      icono: '👤',
    },
    {
      id: 'regimenes-fiscales',
      grupoId: 'terceros',
      nombre: 'Regímenes Fiscales / IVA',
      descripcion: 'Responsabilidades tributarias frente al IVA y régimen simple',
      icono: '⚖️',
    },
    {
      id: 'clasificaciones-tercero',
      grupoId: 'terceros',
      nombre: 'Clasificaciones de Terceros',
      descripcion: 'Roles de negocio: Clientes, Proveedores, Empleados, Socios',
      icono: '🏷️',
    },
    {
      id: 'tipos-comprobante',
      grupoId: 'contabilidad',
      nombre: 'Tipos de Comprobantes',
      descripcion: 'Comprobantes de contabilidad: Ingreso, Egreso, Factura, Nota Contable',
      icono: '🧾',
    },
    {
      id: 'metodos-pago',
      grupoId: 'contabilidad',
      nombre: 'Métodos de Pago',
      descripcion: 'Medios de recaudo y desembolso DIAN: Efectivo, Transferencia, Tarjeta',
      icono: '💳',
    },
    {
      id: 'departamentos-dane',
      grupoId: 'geografia',
      nombre: 'Departamentos DANE',
      descripcion: '32 Departamentos oficiales de la República de Colombia y Distrito Capital',
      icono: '🗺️',
      esGeografico: true,
    },
    {
      id: 'municipios-dane',
      grupoId: 'geografia',
      nombre: 'Municipios Divipola DANE',
      descripcion: 'Municipios y ciudades oficiales con código Divipola de 5 dígitos para ReteICA',
      icono: '📍',
      esGeografico: true,
    },
  ];

  nuevoRegistro: any = {
    codigo: '',
    nombre: '',
    codigo_dian: '',
    aplica_digito_verificacion: false,
    exige_razon_social: false,
    codigo_responsabilidad_dian: '',
    prefijo: '',
    exige_referencia: false,
  };

  private parametrosService = inject(ParametrosService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.cargarDatos();
  }

  configActiva(): CatalogoConfig | undefined {
    return this.catalogos.find((c) => c.id === this.catalogoActivo);
  }

  grupoActivo(): GrupoConfig | undefined {
    const config = this.configActiva();
    return this.grupos.find((g) => g.id === config?.grupoId);
  }

  catalogosFiltrados(): CatalogoConfig[] {
    const query = this.busquedaCatalogo.trim().toLowerCase();
    if (!query) return this.catalogos;
    return this.catalogos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(query) ||
        c.descripcion.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
    );
  }

  catalogosFiltradosPorGrupo(grupoId: string): CatalogoConfig[] {
    return this.catalogosFiltrados().filter((c) => c.grupoId === grupoId);
  }

  seleccionarCatalogo(id: CatalogoTipo): void {
    this.catalogoActivo = id;
    this.filtroTabla = '';
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (this.catalogoActivo === 'departamentos-dane') {
      this.parametrosService.obtenerDepartamentos().subscribe({
        next: (data) => this.departamentos.set(data),
        error: (err) => console.error('Error cargando departamentos:', err),
      });
      return;
    }

    if (this.catalogoActivo === 'municipios-dane') {
      this.parametrosService.buscarMunicipios().subscribe({
        next: (data) => this.municipios.set(data),
        error: (err) => console.error('Error cargando municipios:', err),
      });
      return;
    }

    let obs;
    switch (this.catalogoActivo) {
      case 'tipos-identificacion':
        obs = this.parametrosService.obtenerTiposIdentificacion();
        break;
      case 'tipos-persona':
        obs = this.parametrosService.obtenerTiposPersona();
        break;
      case 'regimenes-fiscales':
        obs = this.parametrosService.obtenerRegimenesFiscales();
        break;
      case 'clasificaciones-tercero':
        obs = this.parametrosService.obtenerClasificacionesTercero();
        break;
      case 'tipos-comprobante':
        obs = this.parametrosService.obtenerTiposComprobante();
        break;
      case 'metodos-pago':
        obs = this.parametrosService.obtenerMetodosPago();
        break;
    }

    if (obs) {
      obs.subscribe({
        next: (data) => this.items.set(data),
        error: (err) => console.error('Error cargando catálogo:', err),
      });
    }
  }

  itemsFiltrados(): ParametroItem[] {
    const q = this.filtroTabla.trim().toLowerCase();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.codigo.toLowerCase().includes(q) ||
        item.nombre.toLowerCase().includes(q) ||
        (item.codigo_dian && item.codigo_dian.toLowerCase().includes(q))
    );
  }

  departamentosFiltrados(): DepartamentoItem[] {
    const q = this.filtroTabla.trim().toLowerCase();
    const list = this.departamentos();
    if (!q) return list;
    return list.filter(
      (dep) =>
        dep.codigo.toLowerCase().includes(q) ||
        dep.nombre.toLowerCase().includes(q)
    );
  }

  municipiosFiltrados(): MunicipioItem[] {
    const q = this.filtroTabla.trim().toLowerCase();
    const list = this.municipios();
    if (!q) return list;
    return list.filter(
      (mun) =>
        mun.codigo.toLowerCase().includes(q) ||
        mun.nombre.toLowerCase().includes(q) ||
        mun.departamento_nombre.toLowerCase().includes(q)
    );
  }

  totalRegistrosActivos(): number {
    if (this.catalogoActivo === 'departamentos-dane') {
      return this.departamentosFiltrados().length;
    }
    if (this.catalogoActivo === 'municipios-dane') {
      return this.municipiosFiltrados().length;
    }
    return this.itemsFiltrados().length;
  }

  sembrarDefaults(): void {
    this.parametrosService.sembrarCatalogos().subscribe({
      next: () => {
        alert('¡Semillas maestras sincronizadas con la base de datos!');
        this.cargarDatos();
      },
      error: (err) => alert('Error sincronizando semillas: ' + err.message),
    });
  }

  alternarEstado(item: ParametroItem): void {
    const nuevoEstado = !item.activo;
    this.parametrosService.cambiarEstado(this.catalogoActivo, item.id, nuevoEstado).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => alert(err.error?.message || 'Error cambiando estado.'),
    });
  }

  abrirModalNuevo(): void {
    this.nuevoRegistro = {
      codigo: '',
      nombre: '',
      codigo_dian: '',
      aplica_digito_verificacion: false,
      exige_razon_social: false,
      codigo_responsabilidad_dian: '',
      prefijo: '',
      exige_referencia: false,
    };
    this.errorMsg.set(null);
    this.mostrarModal.set(true);
  }

  puedeGuardar(): boolean {
    return (
      this.nuevoRegistro.codigo?.trim().length > 0 &&
      this.nuevoRegistro.nombre?.trim().length > 0
    );
  }

  guardarNuevo(): void {
    if (!this.puedeGuardar()) return;

    const emp = this.authService.empresaActiva();
    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      ...this.nuevoRegistro,
      empresa_id: emp?.empresa_id || undefined,
      codigo: this.nuevoRegistro.codigo.trim().toUpperCase(),
      nombre: this.nuevoRegistro.nombre.trim(),
    };

    let obs;
    switch (this.catalogoActivo) {
      case 'tipos-identificacion':
        obs = this.parametrosService.crearTipoIdentificacion(payload);
        break;
      case 'tipos-persona':
        obs = this.parametrosService.crearTipoPersona(payload);
        break;
      case 'regimenes-fiscales':
        obs = this.parametrosService.crearRegimenFiscal(payload);
        break;
      case 'clasificaciones-tercero':
        obs = this.parametrosService.crearClasificacionTercero(payload);
        break;
      case 'tipos-comprobante':
        obs = this.parametrosService.crearTipoComprobante(payload);
        break;
      case 'metodos-pago':
        obs = this.parametrosService.crearMetodoPago(payload);
        break;
    }

    if (obs) {
      obs.subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModal.set(false);
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorMsg.set(err.error?.message || 'Error creando registro.');
        },
      });
    }
  }

  imprimirCatalogo(): void {
    window.print();
  }
}
