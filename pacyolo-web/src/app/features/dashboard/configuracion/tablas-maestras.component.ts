import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';
import { AuthService } from '../../../core/services/auth.service';

type CatalogoTipo =
  | 'tipos-identificacion'
  | 'tipos-persona'
  | 'regimenes-fiscales'
  | 'clasificaciones-tercero'
  | 'tipos-comprobante'
  | 'metodos-pago';

@Component({
  selector: 'app-tablas-maestras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>⚙️</span>
            Tablas Maestras & Parametrización Dinámica
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Configuración universal de catálogos sin datos quemados: cree, active, desactive e imprima cualquier opción
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="sembrarDefaults()"
            class="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Verificar y asegurar semillas DIAN"
          >
            🌱 Semillas Oficiales
          </button>

          <button
            type="button"
            (click)="imprimirCatalogo()"
            class="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            title="Imprimir catálogo activo para archivo fiscal"
          >
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>

          <button
            type="button"
            (click)="abrirModalNuevo()"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            + Nuevo Registro
          </button>
        </div>
      </div>

      <!-- Barra de Pestañas de Catálogos -->
      <div class="flex overflow-x-auto border-b border-slate-800 gap-2 pb-px text-xs font-semibold">
        <button
          (click)="cambiarPestana('tipos-identificacion')"
          [class]="pestanaActiva === 'tipos-identificacion' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 rounded-t-xl transition whitespace-nowrap"
        >
          🪪 Tipos de Identificación
        </button>
        <button
          (click)="cambiarPestana('tipos-persona')"
          [class]="pestanaActiva === 'tipos-persona' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 rounded-t-xl transition whitespace-nowrap"
        >
          👤 Tipos de Persona
        </button>
        <button
          (click)="cambiarPestana('regimenes-fiscales')"
          [class]="pestanaActiva === 'regimenes-fiscales' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 rounded-t-xl transition whitespace-nowrap"
        >
          ⚖️ Regímenes Fiscales / IVA
        </button>
        <button
          (click)="cambiarPestana('clasificaciones-tercero')"
          [class]="pestanaActiva === 'clasificaciones-tercero' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 rounded-t-xl transition whitespace-nowrap"
        >
          🏷️ Clasificaciones de Terceros
        </button>
        <button
          (click)="cambiarPestana('tipos-comprobante')"
          [class]="pestanaActiva === 'tipos-comprobante' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 rounded-t-xl transition whitespace-nowrap"
        >
          🧾 Tipos de Comprobantes
        </button>
        <button
          (click)="cambiarPestana('metodos-pago')"
          [class]="pestanaActiva === 'metodos-pago' ? 'border-b-2 border-indigo-500 text-white bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'"
          class="px-4 py-2.5 rounded-t-xl transition whitespace-nowrap"
        >
          💳 Métodos de Pago
        </button>
      </div>

      <!-- Tabla del Catálogo Activo -->
      <div id="seccion-a-imprimir" class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
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
              @for (item of items(); track item.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-mono font-bold text-white">{{ item.codigo }}</td>
                  <td class="py-3 px-4 font-medium text-slate-200">
                    {{ item.nombre }}
                  </td>
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
                    <span *ngIf="item.exige_razon_social" class="text-cyan-400 font-medium">
                      Exige Razón Social
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [class]="item.es_sistema ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'"
                      class="px-2 py-0.5 rounded text-[10px] font-semibold border"
                    >
                      {{ item.es_sistema ? 'Oficial / Sistema' : 'Personalizado' }}
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
                      class="px-2.5 py-1 text-xs rounded-lg border transition"
                      [class]="item.activo ? 'text-amber-400 hover:bg-amber-950/40 border-amber-800/40' : 'text-emerald-400 hover:bg-emerald-950/40 border-emerald-800/40'"
                    >
                      {{ item.activo ? 'Inactivar' : 'Reactivar' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-500 text-xs">
                    No se encontraron registros en este catálogo maestro.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Creación de Parámetro -->
      <div *ngIf="mostrarModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400">✨</span>
              Crear Nuevo Registro en {{ tituloModal() }}
            </h3>
            <button (click)="mostrarModal.set(false)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold">&times;</button>
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
            <div *ngIf="pestanaActiva === 'tipos-identificacion'" class="space-y-3">
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

            <div *ngIf="pestanaActiva === 'tipos-comprobante'" class="space-y-3">
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

            <div *ngIf="pestanaActiva === 'regimenes-fiscales'" class="space-y-3">
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

            <div *ngIf="pestanaActiva === 'metodos-pago'" class="space-y-3">
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
              class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="guardarNuevo()"
              [disabled]="guardando() || !puedeGuardar()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition"
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
  pestanaActiva: CatalogoTipo = 'tipos-identificacion';
  items = signal<ParametroItem[]>([]);
  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

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

  cambiarPestana(p: CatalogoTipo): void {
    this.pestanaActiva = p;
    this.cargarDatos();
  }

  cargarDatos(): void {
    let obs;
    switch (this.pestanaActiva) {
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

    obs.subscribe({
      next: (data) => this.items.set(data),
      error: (err) => console.error('Error cargando catálogo:', err),
    });
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
    this.parametrosService.cambiarEstado(this.pestanaActiva, item.id, nuevoEstado).subscribe({
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

  tituloModal(): string {
    switch (this.pestanaActiva) {
      case 'tipos-identificacion':
        return 'Tipos de Identificación';
      case 'tipos-persona':
        return 'Tipos de Persona';
      case 'regimenes-fiscales':
        return 'Regímenes Fiscales';
      case 'clasificaciones-tercero':
        return 'Clasificaciones de Terceros';
      case 'tipos-comprobante':
        return 'Tipos de Comprobantes';
      case 'metodos-pago':
        return 'Métodos de Pago';
    }
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
    switch (this.pestanaActiva) {
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

  imprimirCatalogo(): void {
    window.print();
  }
}
