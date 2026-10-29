import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface MiembroEmpresa {
  id: string;
  usuario_id: string;
  empresa_id: string;
  rol: string;
  activo: boolean;
  created_at: string;
  usuario: {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
  };
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">Equipo de Trabajo & Roles RBAC</h2>
          <p class="text-xs text-slate-400 mt-0.5">Control de acceso y privilegios contextuales para esta empresa</p>
        </div>
        <button
          (click)="mostrarModalCrear.set(true)"
          class="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition cursor-pointer"
        >
          + Invitar Colaborador
        </button>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Colaborador</th>
                <th class="py-3 px-4">Correo Electrónico</th>
                <th class="py-3 px-4">Rol en Empresa</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              @for (m of miembros(); track m.id) {
                <tr class="hover:bg-slate-800/30 transition">
                  <td class="py-3 px-4 font-bold text-white">{{ m.usuario?.nombres }} {{ m.usuario?.apellidos }}</td>
                  <td class="py-3 px-4 font-mono text-slate-400">{{ m.usuario?.email }}</td>
                  <td class="py-3 px-4">
                    <select
                      [value]="m.rol"
                      (change)="cambiarRol(m.usuario_id, $event)"
                      class="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-indigo-400 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="ADMIN_EMPRESA">ADMIN_EMPRESA</option>
                      <option value="CONTADOR_LIDER">CONTADOR_LIDER</option>
                      <option value="AUXILIAR_CONTABLE">AUXILIAR_CONTABLE</option>
                      <option value="AUDITOR_CONSULTA">AUDITOR_CONSULTA</option>
                    </select>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span
                      [class]="m.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'"
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {{ m.activo ? 'ACTIVO' : 'REVOCADO' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    @if (m.activo) {
                      <button
                        (click)="revocarAcceso(m.usuario_id)"
                        class="text-[11px] text-rose-400 hover:text-rose-300 font-medium transition cursor-pointer"
                      >
                        Desactivar Acceso
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-8 text-center text-slate-500 text-xs">
                    No hay miembros registrados en este tenant.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Invitar Usuario -->
      @if (mostrarModalCrear()) {
        <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 class="text-base font-bold text-white mb-4">Invitar Nuevo Colaborador</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Nombres</label>
                <input type="text" [(ngModel)]="nuevoUsuario.nombres" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Apellidos</label>
                <input type="text" [(ngModel)]="nuevoUsuario.apellidos" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input type="email" [(ngModel)]="nuevoUsuario.email" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Contraseña Inicial</label>
                <input type="password" [(ngModel)]="nuevoUsuario.password" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Rol Asignado</label>
                <select [(ngModel)]="nuevoUsuario.rol" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
                  <option value="ADMIN_EMPRESA">Administrador de Empresa</option>
                  <option value="CONTADOR_LIDER">Contador Líder</option>
                  <option value="AUXILIAR_CONTABLE">Auxiliar Contable</option>
                  <option value="AUDITOR_CONSULTA">Auditor / Revisor Fiscal</option>
                </select>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button (click)="mostrarModalCrear.set(false)" class="px-4 py-2 border border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white transition">Cancelar</button>
              <button (click)="guardarUsuario()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition">Guardar y Asignar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class UsuariosAdminComponent implements OnInit {
  miembros = signal<MiembroEmpresa[]>([]);
  mostrarModalCrear = signal(false);

  nuevoUsuario = {
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    rol: 'AUXILIAR_CONTABLE',
  };

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cargarMiembros();
  }

  cargarMiembros(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .get<MiembroEmpresa[]>(`http://localhost:3000/api/v1/usuarios/empresa/${emp.empresa_id}`)
      .subscribe({
        next: (data) => this.miembros.set(data),
        error: (err) => console.error('Error cargando equipo:', err),
      });
  }

  cambiarRol(usuarioId: string, event: Event): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    const nuevoRol = (event.target as HTMLSelectElement).value;
    this.http
      .patch(`http://localhost:3000/api/v1/usuarios/${usuarioId}/empresa/${emp.empresa_id}/rol`, {
        rol: nuevoRol,
      })
      .subscribe({
        next: () => {
          this.notificationService.info('Rol de usuario actualizado exitosamente.');
          this.cargarMiembros();
        },
        error: (err) => this.notificationService.error('Error al actualizar rol: ' + (err.error?.message || err.message)),
      });
  }

  async revocarAcceso(usuarioId: string): Promise<void> {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    const confirmado = await this.notificationService.confirm({
      title: 'Revocar Acceso a la Empresa',
      message: '¿Confirma que desea revocar el acceso de este usuario a la empresa activa? Perderá todos los privilegios inmediatamente.',
      confirmText: 'Revocar Acceso',
      intent: 'danger',
    });
    if (!confirmado) return;

    this.http
      .delete(`http://localhost:3000/api/v1/usuarios/${usuarioId}/empresa/${emp.empresa_id}`)
      .subscribe({
        next: () => {
          this.notificationService.warning('Acceso de usuario revocado.');
          this.cargarMiembros();
        },
        error: (err) => this.notificationService.error('Error al revocar acceso: ' + (err.error?.message || err.message)),
      });
  }

  guardarUsuario(): void {
    const emp = this.authService.empresaActiva();
    if (!emp) return;

    this.http
      .post('http://localhost:3000/api/v1/usuarios', {
        ...this.nuevoUsuario,
        empresa_id: emp.empresa_id,
      })
      .subscribe({
        next: () => {
          this.mostrarModalCrear.set(false);
          this.notificationService.success('Usuario registrado y vinculado a la empresa con éxito.');
          this.cargarMiembros();
          this.nuevoUsuario = {
            nombres: '',
            apellidos: '',
            email: '',
            password: '',
            rol: 'AUXILIAR_CONTABLE',
          };
        },
        error: (err) => this.notificationService.error('Error al registrar usuario: ' + (err.error?.message || err.message)),
      });
  }
}
