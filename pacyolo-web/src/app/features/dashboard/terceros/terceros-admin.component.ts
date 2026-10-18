import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';

export interface Tercero {
  id: string;
  tipo_persona: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  digito_verificacion?: number | null;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  codigo_municipio?: string;
  regimen_iva: string;
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
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📇</span>
            Directorio de Terceros NIIF
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Gestión universal de Clientes, Proveedores y Empleados con validación DIAN
          </p>
        </div>

        <button
          type="button"
          (click)="abrirModalNuevo()"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          + Nuevo Tercero
        </button>
      </div>

      <!-- Filtros de búsqueda y clasificación -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex-1 min-w-[240px]">
          <input
            type="text"
            [(ngModel)]="busqueda"
            placeholder="Buscar por número de documento o nombre/razón social..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="filtroTipo = 'TODOS'"
            [class]="filtroTipo === 'TODOS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition"
          >
            Todos
          </button>
          <button
            (click)="filtroTipo = 'CLIENTES'"
            [class]="filtroTipo === 'CLIENTES' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition"
          >
            Clientes
          </button>
          <button
            (click)="filtroTipo = 'PROVEEDORES'"
            [class]="filtroTipo === 'PROVEEDORES' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition"
          >
            Proveedores
          </button>
          <button
            (click)="filtroTipo = 'EMPLEADOS'"
            [class]="filtroTipo === 'EMPLEADOS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'"
            class="px-3 py-1.5 text-xs font-medium rounded-lg transition"
          >
            Empleados
          </button>
        </div>
      </div>

      <!-- Tabla de Terceros -->
      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Identificación</th>
                <th class="py-3 px-4">Razón Social / Nombre</th>
                <th class="py-3 px-4">Tipo</th>
                <th class="py-3 px-4">Régimen IVA</th>
                <th class="py-3 px-4">Contacto</th>
                <th class="py-3 px-4 text-center">Clasificación</th>
                <th class="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (t of tercerosFiltrados(); track t.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-mono font-medium text-white">
                    <span class="text-slate-500 font-sans text-[11px] mr-1">{{ t.tipo_identificacion }}</span>
                    {{ t.numero_identificacion }}
                    <span *ngIf="t.digito_verificacion !== null && t.digito_verificacion !== undefined" class="text-indigo-400 font-bold">
                      -{{ t.digito_verificacion }}
                    </span>
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-200">
                    {{ t.nombre_completo }}
                    <div *ngIf="t.direccion" class="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                      {{ t.direccion }}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                      {{ t.tipo_persona }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span
                      [class]="t.regimen_iva === 'RESPONSABLE' ? 'text-amber-400 font-medium' : 'text-slate-400'"
                    >
                      {{ t.regimen_iva }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-400 text-[11px]">
                    <div *ngIf="t.email" class="truncate max-w-[180px]">{{ t.email }}</div>
                    <div *ngIf="t.telefono" class="font-mono text-slate-500">{{ t.telefono }}</div>
                  </td>
                  <td class="py-3 px-4 text-center space-x-1">
                    <span *ngIf="t.es_cliente" class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CLI
                    </span>
                    <span *ngIf="t.es_proveedor" class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      PROV
                    </span>
                    <span *ngIf="t.es_empleado" class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      EMP
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [class]="t.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ t.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500 text-xs">
                    No se encontraron terceros registrados con ese criterio.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Crear Tercero -->
      <div *ngIf="mostrarModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400">📇</span>
              Registrar Nuevo Tercero
            </h3>
            <button (click)="mostrarModal.set(false)" class="text-slate-400 hover:text-slate-200 text-2xl font-bold">&times;</button>
          </div>

          <div *ngIf="errorMsg()" class="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            {{ errorMsg() }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Identificación *</label>
              <select
                [(ngModel)]="nuevoTercero.tipo_identificacion"
                (change)="onCambioIdentificacion()"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Seleccionar Tipo Documento --</option>
                <option *ngFor="let t of tiposIdentificacion()" [value]="t.codigo">
                  {{ t.codigo }} — {{ t.nombre }} {{ t.codigo_dian ? ('(DIAN ' + t.codigo_dian + ')') : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Número de Documento *</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [(ngModel)]="nuevoTercero.numero_identificacion"
                  (input)="onCambioIdentificacion()"
                  placeholder="Ej: 900123456"
                  class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <div *ngIf="aplicaDigitoVerificacion()" class="w-16 text-center">
                  <span class="block text-[9px] text-slate-500 font-mono">DV DIAN</span>
                  <span class="inline-block px-2.5 py-1 text-xs font-black bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                    {{ nuevoTercero.digito_verificacion !== undefined ? nuevoTercero.digito_verificacion : '-' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Razón Social o Nombre Completo *</label>
              <input
                type="text"
                [(ngModel)]="nuevoTercero.nombre_completo"
                placeholder="Ej: DISTRIBUIDORA NACIONAL SAS o Juan Pérez"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Persona *</label>
              <select
                [(ngModel)]="nuevoTercero.tipo_persona"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Seleccionar Tipo Persona --</option>
                <option *ngFor="let tp of tiposPersona()" [value]="tp.codigo">
                  {{ tp.nombre }} ({{ tp.codigo }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Régimen de IVA / Fiscal *</label>
              <select
                [(ngModel)]="nuevoTercero.regimen_iva"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Seleccionar Régimen Fiscal --</option>
                <option *ngFor="let r of regimenesFiscales()" [value]="r.codigo">
                  {{ r.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                [(ngModel)]="nuevoTercero.email"
                placeholder="facturacion@proveedor.com"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Móvil</label>
              <input
                type="text"
                [(ngModel)]="nuevoTercero.telefono"
                placeholder="3001234567"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Dirección Física</label>
              <input
                type="text"
                [(ngModel)]="nuevoTercero.direccion"
                placeholder="Calle 100 # 15-20 Edificio Torre Norte"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Clasificación de Roles -->
            <div class="md:col-span-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span class="block text-xs font-semibold text-slate-300 mb-2">Clasificación en el Negocio:</span>
              <div class="flex flex-wrap gap-6 text-xs text-slate-300">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="nuevoTercero.es_cliente" class="rounded text-indigo-600" />
                  <span>Es Cliente</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="nuevoTercero.es_proveedor" class="rounded text-indigo-600" />
                  <span>Es Proveedor</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="nuevoTercero.es_empleado" class="rounded text-indigo-600" />
                  <span>Es Empleado</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="nuevoTercero.es_gran_contribuyente" class="rounded text-indigo-600" />
                  <span>Gran Contribuyente</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="nuevoTercero.es_autorretenedor" class="rounded text-indigo-600" />
                  <span>Autorretenedor</span>
                </label>
              </div>
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
              (click)="guardarTercero()"
              [disabled]="guardando() || !puedeGuardar()"
              class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow transition"
            >
              {{ guardando() ? 'Guardando...' : 'Guardar Tercero' }}
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

  mostrarModal = signal<boolean>(false);
  guardando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  busqueda = '';
  filtroTipo = 'TODOS';

  nuevoTercero = {
    tipo_persona: 'JURIDICA',
    tipo_identificacion: 'NIT',
    numero_identificacion: '',
    digito_verificacion: undefined as number | undefined,
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    regimen_iva: 'RESPONSABLE_IVA',
    es_cliente: false,
    es_proveedor: true,
    es_empleado: false,
    es_gran_contribuyente: false,
    es_autorretenedor: false,
  };

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
        t.nombre_completo.toLowerCase().includes(q),
    );
  }

  abrirModalNuevo(): void {
    this.nuevoTercero = {
      tipo_persona: 'JURIDICA',
      tipo_identificacion: 'NIT',
      numero_identificacion: '',
      digito_verificacion: undefined,
      nombre_completo: '',
      email: '',
      telefono: '',
      direccion: '',
      regimen_iva: 'RESPONSABLE',
      es_cliente: false,
      es_proveedor: true,
      es_empleado: false,
      es_gran_contribuyente: false,
      es_autorretenedor: false,
    };
    this.errorMsg.set(null);
    this.mostrarModal.set(true);
  }

  /**
   * Calcula el Dígito de Verificación (DV) oficial de la DIAN Colombia (Algoritmo Módulo 11)
   */
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

  aplicaDigitoVerificacion(): boolean {
    const tipo = this.tiposIdentificacion().find(
      (t) => t.codigo === this.nuevoTercero.tipo_identificacion,
    );
    return tipo?.aplica_digito_verificacion === true;
  }

  onCambioIdentificacion(): void {
    if (this.aplicaDigitoVerificacion()) {
      this.nuevoTercero.digito_verificacion = this.calcularDvDian(this.nuevoTercero.numero_identificacion);
    } else {
      this.nuevoTercero.digito_verificacion = undefined;
    }
  }

  puedeGuardar(): boolean {
    return (
      this.nuevoTercero.numero_identificacion.trim().length > 0 &&
      this.nuevoTercero.nombre_completo.trim().length > 0
    );
  }

  guardarTercero(): void {
    if (!this.puedeGuardar()) return;

    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      empresa_id: emp.empresa_id,
      ...this.nuevoTercero,
      numero_identificacion: this.nuevoTercero.numero_identificacion.trim(),
      nombre_completo: this.nuevoTercero.nombre_completo.trim(),
    };

    this.http.post('http://localhost:3000/api/v1/terceros', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.cargarTerceros();
      },
      error: (err) => {
        this.guardando.set(false);
        const backendMsg = err.error?.message;
        const msg = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg || 'Error guardando tercero.';
        this.errorMsg.set(msg);
      },
    });
  }
}
