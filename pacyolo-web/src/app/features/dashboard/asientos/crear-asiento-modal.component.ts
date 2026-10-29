import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ParametrosService, ParametroItem } from '../../../core/services/parametros.service';
import { computed } from '@angular/core';
import { PucLookupModalComponent } from '../../../shared/components/puc-lookup-modal.component';
import { TerceroLookupModalComponent } from '../../../shared/components/tercero-lookup-modal.component';

interface CuentaAuxiliar {
  id: string;
  codigo: string;
  nombre: string;
  naturaleza: string;
  es_auxiliar: boolean;
}

interface TerceroItem {
  id: string;
  numero_documento: string;
  razon_social: string;
  primer_nombre?: string;
  primer_apellido?: string;
}

interface LineaForm {
  cuenta_id: string;
  tercero_id: string;
  glosa_detalle: string;
  documento_referencia: string;
  debito: number;
  credito: number;
}

@Component({
  selector: 'app-crear-asiento-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PucLookupModalComponent, TerceroLookupModalComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl my-8">
        <!-- Encabezado del Modal -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white tracking-tight">Nuevo Comprobante Contable</h2>
              <p class="text-xs text-slate-400">Registro manual con validación estricta de Partida Doble NIIF</p>
            </div>
          </div>
          <button
            (click)="cerrar.emit()"
            class="text-slate-400 hover:text-slate-200 text-2xl font-light leading-none p-1"
          >
            &times;
          </button>
        </div>

        <!-- Alerta de Error si ocurre -->
        <div *ngIf="errorMsg()" class="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMsg() }}</span>
        </div>

        <!-- Formulario Cabecera -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Comprobante *</label>
            <select
              [(ngModel)]="tipoComprobante"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Seleccionar Tipo Comprobante --</option>
              <option *ngFor="let comp of tiposComprobante()" [value]="comp.codigo">
                {{ comp.codigo }} — {{ comp.nombre }} {{ comp.prefijo ? ('[' + comp.prefijo + ']') : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Fecha Contable *</label>
            <input
              type="date"
              [(ngModel)]="fechaContable"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Concepto General / Glosa *</label>
            <input
              type="text"
              [(ngModel)]="glosaGeneral"
              placeholder="Ej: Pago de servicios públicos de la sede principal"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Tabla de Apuntes / Líneas -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Apuntes Contables (Mínimo 2 líneas)
            </h3>
            <button
              type="button"
              (click)="agregarLinea()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Línea
            </button>
          </div>

          <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 shadow-inner">
            <div class="overflow-x-auto max-h-72 overflow-y-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3 min-w-[220px]">Cuenta PUC (Auxiliar) *</th>
                    <th class="py-2.5 px-3 min-w-[180px]">Tercero (NIT / Razón)</th>
                    <th class="py-2.5 px-3 min-w-[160px]">Concepto / Detalle</th>
                    <th class="py-2.5 px-3 w-28">Doc. Ref</th>
                    <th class="py-2.5 px-3 w-32 text-right">Débito ($)</th>
                    <th class="py-2.5 px-3 w-32 text-right">Crédito ($)</th>
                    <th class="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let linea of lineas; let i = index" class="hover:bg-slate-800/20">
                    <!-- Selector de Cuenta PUC con Enterprise Lookup -->
                    <td class="p-2">
                      @if (obtenerCuenta(linea.cuenta_id); as cta) {
                        <div class="flex items-center justify-between p-1.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-xs">
                          <div class="truncate">
                            <span class="font-mono font-bold text-emerald-400 mr-1">{{ cta.codigo }}</span>
                            <span class="text-white text-[11px]">{{ cta.nombre }}</span>
                          </div>
                          <button
                            type="button"
                            (click)="abrirLookupCuenta(i)"
                            class="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded transition cursor-pointer ml-1 text-[11px]"
                            title="Cambiar cuenta PUC"
                          >
                            🔍
                          </button>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="abrirLookupCuenta(i)"
                          class="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-300 rounded-lg text-xs transition cursor-pointer"
                        >
                          <span>🔍 Seleccionar Cuenta...</span>
                          <span class="text-[10px] text-emerald-400 font-mono">PUC</span>
                        </button>
                      }
                    </td>

                    <!-- Selector de Tercero con Enterprise Lookup -->
                    <td class="p-2">
                      @if (obtenerTercero(linea.tercero_id); as ter) {
                        <div class="flex items-center justify-between p-1.5 bg-slate-950 border border-indigo-500/40 rounded-lg text-xs">
                          <div class="truncate">
                            <span class="font-mono font-bold text-indigo-400 mr-1">{{ ter.numero_documento }}</span>
                            <span class="text-white text-[11px]">{{ ter.razon_social || (ter.primer_nombre ? (ter.primer_nombre + ' ' + (ter.primer_apellido || '')) : 'Tercero') }}</span>
                          </div>
                          <div class="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              (click)="abrirLookupTercero(i)"
                              class="p-1 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 rounded transition cursor-pointer text-[11px]"
                              title="Cambiar tercero"
                            >
                              🔍
                            </button>
                            <button
                              type="button"
                              (click)="linea.tercero_id = ''"
                              class="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer text-[11px]"
                              title="Quitar tercero"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      } @else {
                        <button
                          type="button"
                          (click)="abrirLookupTercero(i)"
                          class="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 rounded-lg text-xs transition cursor-pointer"
                        >
                          <span class="truncate">🔍 Tercero (Opcional)...</span>
                          <span class="text-[10px] text-slate-500 font-mono">NIT</span>
                        </button>
                      }
                    </td>

                    <!-- Concepto de la línea -->
                    <td class="p-2">
                      <input
                        type="text"
                        [(ngModel)]="linea.glosa_detalle"
                        [placeholder]="glosaGeneral || 'Detalle del apunte'"
                        class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </td>

                    <!-- Documento de Referencia -->
                    <td class="p-2">
                      <input
                        type="text"
                        [(ngModel)]="linea.documento_referencia"
                        placeholder="Factura / Recibo"
                        class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </td>

                    <!-- Débito -->
                    <td class="p-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        [(ngModel)]="linea.debito"
                        (input)="onCambioDebito(linea)"
                        placeholder="0.00"
                        class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-right text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    <!-- Crédito -->
                    <td class="p-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        [(ngModel)]="linea.credito"
                        (input)="onCambioCredito(linea)"
                        placeholder="0.00"
                        class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-right text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </td>

                    <!-- Botón Eliminar Fila -->
                    <td class="p-2 text-center">
                      <button
                        type="button"
                        (click)="eliminarLinea(i)"
                        [disabled]="lineas.length <= 2"
                        class="text-slate-500 hover:text-rose-400 disabled:opacity-20 transition"
                        title="Eliminar línea"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Balanza de Sumas Iguales en Tiempo Real -->
            <div class="bg-slate-950 p-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div *ngIf="estaCuadrado()" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Partida Doble Balanceada (Diferencia: $ 0.00)
                </div>

                <div *ngIf="!estaCuadrado()" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold animate-pulse">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Descuadre Contable: {{ diferenciaAbsoluta() | currency:'COP':'symbol-narrow':'1.2-2' }}
                </div>
              </div>

              <div class="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase">Total Débitos</span>
                  <span class="font-bold text-white text-sm">{{ totalDebitos() | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase">Total Créditos</span>
                  <span class="font-bold text-white text-sm">{{ totalCreditos() | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            (click)="cerrar.emit()"
            class="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            (click)="guardarAsiento()"
            [disabled]="guardando() || !puedeGuardar()"
            class="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
          >
            <svg *ngIf="guardando()" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Registrar Comprobante Oficial
          </button>
        </div>
      </div>

      <!-- Modales de Búsqueda Avanzada (Enterprise Lookup) -->
      <app-puc-lookup-modal
        [(visible)]="mostrarLookupCuenta"
        titulo="Seleccionar Cuenta Contable PUC (Auxiliar)"
        [cuentas]="cuentasAuxiliares()"
        (cuentaSeleccionada)="alSeleccionarCuentaLookup($event)"
      />

      <app-tercero-lookup-modal
        [(visible)]="mostrarLookupTercero"
        titulo="Seleccionar Tercero para Asiento Contable"
        [terceros]="tercerosAdaptados()"
        (seleccionado)="alSeleccionarTerceroLookup($event)"
      />
    </div>
  `,
})
export class CrearAsientoModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardadoExitoso = new EventEmitter<void>();

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private parametrosService = inject(ParametrosService);

  tipoComprobante = 'DIA';
  fechaContable = new Date().toISOString().slice(0, 10);
  glosaGeneral = '';

  lineas: LineaForm[] = [
    { cuenta_id: '', tercero_id: '', glosa_detalle: '', documento_referencia: '', debito: 0, credito: 0 },
    { cuenta_id: '', tercero_id: '', glosa_detalle: '', documento_referencia: '', debito: 0, credito: 0 },
  ];

  // Estados Modales Enterprise Lookup
  readonly mostrarLookupCuenta = signal(false);
  readonly lineaSeleccionandoCuenta = signal<number | null>(null);

  readonly mostrarLookupTercero = signal(false);
  readonly lineaSeleccionandoTercero = signal<number | null>(null);

  readonly tercerosAdaptados = computed(() => {
    return this.terceros().map((t: any) => ({
      id: t.id,
      numero_identificacion: t.numero_documento || t.numero_identificacion || '',
      razon_social: t.razon_social || (t.primer_nombre ? `${t.primer_nombre} ${t.primer_apellido || ''}`.trim() : ''),
      nombre_completo: t.nombre_completo || t.razon_social || (t.primer_nombre ? `${t.primer_nombre} ${t.primer_apellido || ''}`.trim() : ''),
    }));
  });

  obtenerCuenta(id: string): CuentaAuxiliar | undefined {
    return this.cuentasAuxiliares().find((c) => c.id === id);
  }

  obtenerTercero(id: string): TerceroItem | undefined {
    return this.terceros().find((t) => t.id === id);
  }

  abrirLookupCuenta(index: number): void {
    this.lineaSeleccionandoCuenta.set(index);
    this.mostrarLookupCuenta.set(true);
  }

  alSeleccionarCuentaLookup(cuenta: any): void {
    const idx = this.lineaSeleccionandoCuenta();
    if (idx !== null && this.lineas[idx]) {
      this.lineas[idx].cuenta_id = cuenta.id;
    }
    this.mostrarLookupCuenta.set(false);
  }

  abrirLookupTercero(index: number): void {
    this.lineaSeleccionandoTercero.set(index);
    this.mostrarLookupTercero.set(true);
  }

  alSeleccionarTerceroLookup(tercero: any): void {
    const idx = this.lineaSeleccionandoTercero();
    if (idx !== null && this.lineas[idx]) {
      this.lineas[idx].tercero_id = tercero.id;
    }
    this.mostrarLookupTercero.set(false);
  }

  cuentasAuxiliares = signal<CuentaAuxiliar[]>([]);
  terceros = signal<TerceroItem[]>([]);
  tiposComprobante = signal<ParametroItem[]>([]);
  guardando = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarCuentas();
    this.cargarTerceros();
    this.cargarTiposComprobante();
  }

  cargarTiposComprobante(): void {
    this.parametrosService.obtenerTiposComprobante().subscribe({
      next: (data) => {
        const activos = data.filter((d) => d.activo);
        this.tiposComprobante.set(activos);
        if (activos.length > 0 && !this.tipoComprobante) {
          this.tipoComprobante = activos[0].codigo;
        }
      },
      error: (err) => console.error('Error cargando tipos comprobante:', err),
    });
  }

  cargarCuentas(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<CuentaAuxiliar[]>(`http://localhost:3000/api/v1/puc?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (cuentas) => {
          // Filtrar únicamente cuentas auxiliares (imputables)
          const auxiliares = cuentas.filter((c) => c.es_auxiliar);
          this.cuentasAuxiliares.set(auxiliares);
        },
        error: (err) => console.error('Error cargando cuentas:', err),
      });
  }

  cargarTerceros(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<TerceroItem[]>(`http://localhost:3000/api/v1/terceros?empresa_id=${emp.empresa_id}`)
      .subscribe({
        next: (t) => this.terceros.set(t),
        error: (err) => console.error('Error cargando terceros:', err),
      });
  }

  agregarLinea(): void {
    this.lineas.push({
      cuenta_id: '',
      tercero_id: '',
      glosa_detalle: '',
      documento_referencia: '',
      debito: 0,
      credito: 0,
    });
  }

  eliminarLinea(index: number): void {
    if (this.lineas.length > 2) {
      this.lineas.splice(index, 1);
    }
  }

  onCambioDebito(linea: LineaForm): void {
    if (linea.debito > 0) {
      linea.credito = 0;
    }
  }

  onCambioCredito(linea: LineaForm): void {
    if (linea.credito > 0) {
      linea.debito = 0;
    }
  }

  totalDebitos(): number {
    return this.lineas.reduce((acc, l) => acc + (Number(l.debito) || 0), 0);
  }

  totalCreditos(): number {
    return this.lineas.reduce((acc, l) => acc + (Number(l.credito) || 0), 0);
  }

  diferenciaAbsoluta(): number {
    return Math.abs(this.totalDebitos() - this.totalCreditos());
  }

  estaCuadrado(): boolean {
    const deb = Math.round(this.totalDebitos() * 100);
    const cred = Math.round(this.totalCreditos() * 100);
    return deb > 0 && deb === cred;
  }

  puedeGuardar(): boolean {
    if (!this.glosaGeneral.trim()) return false;
    if (!this.fechaContable) return false;
    if (this.lineas.length < 2) return false;
    if (!this.estaCuadrado()) return false;

    // Verificar que todas las líneas tengan cuenta seleccionada
    return this.lineas.every((l) => l.cuenta_id.trim() !== '');
  }

  guardarAsiento(): void {
    if (!this.puedeGuardar()) return;

    const emp = this.authService.empresaActiva();
    if (!emp) {
      this.errorMsg.set('No hay empresa activa seleccionada en la sesión.');
      return;
    }

    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      empresa_id: emp.empresa_id,
      tipo_comprobante: this.tipoComprobante,
      fecha_contable: this.fechaContable,
      glosa_general: this.glosaGeneral.trim(),
      lineas: this.lineas.map((l) => ({
        cuenta_id: l.cuenta_id,
        tercero_id: l.tercero_id || undefined,
        debito: Number(l.debito) || 0,
        credito: Number(l.credito) || 0,
        glosa_detalle: l.glosa_detalle.trim() || this.glosaGeneral.trim(),
        documento_referencia: l.documento_referencia.trim() || undefined,
      })),
    };

    this.http.post('http://localhost:3000/api/v1/asientos', payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardadoExitoso.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        const backendMsg = err.error?.message;
        const msg = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg || 'Error registrando el comprobante contable.';
        this.errorMsg.set(msg);
      },
    });
  }
}
