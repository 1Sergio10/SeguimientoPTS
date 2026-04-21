import { Routes } from '@angular/router';
import { authGuard, profesorGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Auth (sin layout) ─────────────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },

  // ── App (con layout) ──────────────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'grupos',
        canActivate: [profesorGuard],
        loadComponent: () => import('./features/grupos/lista/grupos-lista.component')
          .then(m => m.GruposListaComponent)
      },
      {
        path: 'grupos/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/grupos/detalle/grupo-detalle.component')
          .then(m => m.GrupoDetalleComponent)
      },
      {
        path: 'sprints',
        loadComponent: () => import('./features/sprints/lista/sprints-lista.component')
          .then(m => m.SprintsListaComponent)
      },
      {
        path: 'sprints/:id',
        loadComponent: () => import('./features/sprints/lista/detalle/sprint-detalle.component')
          .then(m => m.SprintDetalleComponent)
      },
      {
        path: 'kanban/:sprintId',
        loadComponent: () => import('./features/tareas/kanban/kanban.component')
          .then(m => m.KanbanComponent)
      },
      {
        path: 'kanban',
        redirectTo: 'sprints',
        pathMatch: 'full'
      },
      {
        path: 'github',
        loadComponent: () => import('./features/github/github-evidencias.component')
          .then(m => m.GithubEvidenciasComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil.component')
          .then(m => m.PerfilComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];