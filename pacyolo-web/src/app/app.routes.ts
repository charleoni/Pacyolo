import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardLayoutComponent } from './features/dashboard/dashboard-layout.component';
import { ResumenComponent } from './features/dashboard/resumen/resumen.component';
import { PucExplorerComponent } from './features/dashboard/puc/puc-explorer.component';
import { LibroDiarioComponent } from './features/dashboard/asientos/libro-diario.component';
import { BorradoresComponent } from './features/dashboard/borradores/borradores.component';
import { UsuariosAdminComponent } from './features/dashboard/usuarios/usuarios-admin.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: ResumenComponent,
      },
      {
        path: 'puc',
        component: PucExplorerComponent,
      },
      {
        path: 'asientos',
        component: LibroDiarioComponent,
      },
      {
        path: 'borradores',
        component: BorradoresComponent,
      },
      {
        path: 'usuarios',
        component: UsuariosAdminComponent,
      },
    ],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
