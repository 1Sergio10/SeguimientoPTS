import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'pts-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-logo">PTS Track</div>
        <div class="login-sub">Seguimiento de proyectos académicos</div>

        <div class="login-field">
          <label class="login-label">Correo</label>
          <input class="login-input" type="email"
            [(ngModel)]="email" placeholder="correo@universidad.edu"/>
        </div>

        <div class="login-field">
          <label class="login-label">Contraseña</label>
          <input class="login-input" type="password"
            [(ngModel)]="password" placeholder="••••••••"
            (keyup.enter)="login()"/>
        </div>

        @if (error()) {
          <div class="login-error">{{ error() }}</div>
        }

        <button class="login-btn" (click)="login()" [disabled]="cargando()">
          {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; background: var(--bg-page);
    }
    .login-box {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 14px; padding: 32px; width: 360px;
    }
    .login-logo { font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
    .login-sub  { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }
    .login-field { margin-bottom: 14px; }
    .login-label { display: block; font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 5px; }
    .login-input {
      width: 100%; padding: 9px 12px; border: 1px solid var(--border);
      border-radius: 8px; font-size: 13px; font-family: var(--font);
      color: var(--text-primary); background: var(--bg-page); outline: none;
    }
    .login-input:focus { border-color: var(--accent); }
    .login-error {
      font-size: 12px; color: #A32D2D; background: #FCEBEB;
      border-radius: 7px; padding: 8px 12px; margin-bottom: 12px;
    }
    .login-btn {
      width: 100%; padding: 10px; border-radius: 8px; border: none;
      background: var(--accent); color: #fff; font-size: 13px;
      font-weight: 500; cursor: pointer; font-family: var(--font);
      transition: background 0.15s; margin-top: 4px;
    }
    .login-btn:hover:not(:disabled) { background: var(--accent-dark); }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class LoginComponent {
  email    = '';
  password = '';
  error    = signal('');
  cargando = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      this.error.set('Completa todos los campos.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error.set('Correo o contraseña incorrectos.');
        this.cargando.set(false);
      }
    });
  }
}