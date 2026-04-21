import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'pts-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">

      <!-- ── Sidebar ────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="logo-mark">PTS</span>
          <span class="logo-sub">Track</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".75"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".75"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".75"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".75"/>
            </svg>
            Dashboard
          </a>

          @if (esProfesor()) {
            <span class="nav-section">Gestión</span>
            <a routerLink="/grupos" routerLinkActive="active" class="nav-item">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="14" height="3" rx="1.5" fill="currentColor" opacity=".75"/>
                <rect x="1" y="6" width="14" height="3" rx="1.5" fill="currentColor" opacity=".75"/>
                <rect x="1" y="11" width="14" height="3" rx="1.5" fill="currentColor" opacity=".75"/>
              </svg>
              Grupos
            </a>
          }

          @if (esEstudiante()) {
            <span class="nav-section">Mi proyecto</span>
            <a [routerLink]="['/grupos', grupoId()]" routerLinkActive="active" class="nav-item">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" opacity=".75"/>
                <path d="M5 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".75"/>
              </svg>
              Mi proyecto
            </a>
          }

          <a routerLink="/perfil" routerLinkActive="active" class="nav-item">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5" opacity=".75"/>
              <path d="M2.5 14c.8-2.6 3.2-4 5.5-4s4.7 1.4 5.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
            </svg>
            Perfil
          </a>

          <a routerLink="/github" routerLinkActive="active" class="nav-item">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M5.5 8.8c-2.4.7-2.4-1.3-3.4-1.6M12.3 10.7v-1.9a1.7 1.7 0 0 0-.5-1.3c1.7-.2 3.5-.8 3.5-3.5a2.8 2.8 0 0 0-.8-2 2.5 2.5 0 0 0-.1-1.9s-.6-.2-2 .8a7 7 0 0 0-3.8 0c-1.4-1-2-.8-2-.8a2.5 2.5 0 0 0-.1 1.9 2.8 2.8 0 0 0-.8 2c0 2.7 1.8 3.3 3.5 3.5a1.7 1.7 0 0 0-.5 1.3v1.9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
            </svg>
            GitHub
          </a>
        </nav>

        <!-- Usuario -->
        <div class="sidebar-user">
          <div class="user-avatar">{{ iniciales() }}</div>
          <div class="user-info">
            <span class="user-name">{{ usuario()?.nombre }}</span>
            <span class="user-role">{{ usuario()?.rol === 'PROFESOR' ? 'Profesor' : 'Estudiante' }}</span>
          </div>
          <button class="logout-btn" (click)="logout()" title="Cerrar sesión">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      <!-- ── Contenido ───────────────────────────────────────── -->
      <main class="main-content">
        <router-outlet />
      </main>

    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-page);
    }

    /* Sidebar */
    .sidebar {
      width: 220px;
      min-width: 220px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border);
      background: var(--bg-sidebar);
      padding: 0;
    }
    .sidebar-logo {
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 20px 20px 16px;
      border-bottom: 1px solid var(--border);
      font-size: 15px;
    }
    .logo-mark { font-weight: 700; color: var(--accent); letter-spacing: -0.5px; }
    .logo-sub  { font-weight: 400; color: var(--text-muted); font-size: 13px; }

    .sidebar-nav {
      flex: 1;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .nav-section {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 12px 10px 4px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 8px 10px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .nav-item.active { background: var(--accent-light); color: var(--accent); }

    /* Usuario */
    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      border-top: 1px solid var(--border);
    }
    .user-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent-light);
      color: var(--accent);
      font-size: 11px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .user-info { flex: 1; overflow: hidden; }
    .user-name  { display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role  { display: block; font-size: 11px; color: var(--text-muted); }
    .logout-btn {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); padding: 4px;
      border-radius: 5px; display: flex;
      transition: color 0.15s;
    }
    .logout-btn:hover { color: var(--text-primary); }

    /* Main */
    .main-content {
      flex: 1;
      overflow-y: auto;
      background: var(--bg-page);
    }
  `]
})
export class MainLayoutComponent {
  readonly usuario;
  readonly esProfesor;
  readonly esEstudiante;
  readonly grupoId;
  readonly iniciales;

  constructor(private auth: AuthService) {
    this.usuario = this.auth.usuario;
    this.esProfesor = this.auth.esProfesor;
    this.esEstudiante = this.auth.esEstudiante;
    this.grupoId = computed(() => this.auth.usuario()?.grupoId);
    this.iniciales = computed(() => {
      const n = this.auth.usuario()?.nombre ?? '';
      return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    });
  }

  logout() { this.auth.logout(); }
}