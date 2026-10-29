import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardLayoutComponent } from './features/dashboard/dashboard-layout.component';
import { ResumenComponent } from './features/dashboard/resumen/resumen.component';
import { PucExplorerComponent } from './features/dashboard/puc/puc-explorer.component';
import { LibroDiarioComponent } from './features/dashboard/asientos/libro-diario.component';
import { BorradoresComponent } from './features/dashboard/borradores/borradores.component';
import { UsuariosAdminComponent } from './features/dashboard/usuarios/usuarios-admin.component';
import { AuditoriaComponent } from './features/dashboard/auditoria/auditoria.component';
import { TablasMaestrasComponent } from './features/dashboard/configuracion/tablas-maestras.component';
import { TercerosAdminComponent } from './features/dashboard/terceros/terceros-admin.component';
import { CxpAdminComponent } from './features/dashboard/cxp/cxp-admin.component';
import { ArticulosAdminComponent } from './features/dashboard/inventarios/articulos-admin.component';
import { ComprasAdminComponent } from './features/dashboard/compras/compras-admin.component';
import { VentasAdminComponent } from './features/dashboard/ventas/ventas-admin.component';
import { CxcAdminComponent } from './features/dashboard/cxc/cxc-admin.component';

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
        path: 'terceros',
        component: TercerosAdminComponent,
      },
      {
        path: 'ventas',
        component: VentasAdminComponent,
      },
      {
        path: 'cxc',
        component: CxcAdminComponent,
      },
      {
        path: 'cxp',
        component: CxpAdminComponent,
      },
      {
        path: 'inventarios/articulos',
        component: ArticulosAdminComponent,
      },
      {
        path: 'inventarios',
        redirectTo: 'inventarios/articulos',
        pathMatch: 'full',
      },
      {
        path: 'articulos',
        redirectTo: 'inventarios/articulos',
        pathMatch: 'full',
      },
      {
        path: 'compras/ordenes',
        component: ComprasAdminComponent,
      },
      {
        path: 'compras',
        redirectTo: 'compras/ordenes',
        pathMatch: 'full',
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
      {
        path: 'auditoria',
        component: AuditoriaComponent,
      },
      {
        path: 'parametros',
        component: TablasMaestrasComponent,
      },
      {
        path: 'parametros/maestras',
        redirectTo: 'parametros',
        pathMatch: 'full',
      },
      {
        path: 'configuracion/maestras',
        redirectTo: 'parametros',
        pathMatch: 'full',
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
