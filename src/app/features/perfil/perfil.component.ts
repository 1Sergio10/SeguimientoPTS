import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'pts-perfil',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <h2 class="page-title">Mi perfil</h2>

      <div class="card">
        <div class="perfil-av">{{ iniciales() }}</div>
        <div class="perfil-nombre">{{ usuario()?.nombre }}</div>
        <div class="perfil-email">{{ usuario()?.email }}</div>
        <div class="divider"></div>
        <div class="info-row"><span class="info-label">Rol</span><span class="info-val">{{ usuario()?.rol === 'PROFESOR' ? 'Profesor' : 'Estudiante' }}</span></div>
        @if (esEstudiante()) {
          <div class="info-row"><span class="info-label">Grupo</span><span class="info-val">Grupo asignado</span></div>
        }
      </div>

      @if (esEstudiante()) {
        <div style="font-size:13px;font-weight:500;margin-bottom:12px;margin-top:4px">Cambiar contraseña</div>
        <div class="card">
          <div class="form-group">
            <label class="form-label">Contraseña actual</label>
            <input class="form-input" type="password" [(ngModel)]="pwd.actual" placeholder="Ingresa tu contraseña actual"/>
          </div>
          <div class="form-group">
            <label class="form-label">Nueva contraseña</label>
            <input class="form-input" type="password" [(ngModel)]="pwd.nueva"
              placeholder="Mínimo 8 caracteres" (input)="checkFuerza()"/>
            <div class="pwd-bars">
              @for (i of [1,2,3,4]; track i) {
                <div class="pwd-bar" [style.background]="i <= fuerza() ? colores[fuerza()-1] : 'var(--border)'"></div>
              }
            </div>
            <div class="pwd-label" [style.color]="colores[fuerza()-1]">{{ etiquetas[fuerza()-1] }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar contraseña</label>
            <input class="form-input" type="password" [(ngModel)]="pwd.confirmar" placeholder="Repite la nueva contraseña"/>
          </div>

          @if (error()) {
            <div class="msg-err">{{ error() }}</div>
          }
          @if (exito()) {
            <div class="msg-ok">Contraseña actualizada correctamente.</div>
          }

          <button class="btn btn-primary" (click)="cambiarPassword()">Guardar nueva contraseña</button>
        </div>
      } @else {
        <div class="note-info">El cambio de contraseña del profesor se gestiona desde la administración institucional.</div>
      }

      <div style="margin-top:12px">
        <button class="btn" (click)="logout()">Cerrar sesión</button>
      </div>
    </div>
  `,
  styles: [`
    .perfil-av { width:56px; height:56px; border-radius:50%; background:var(--accent-light); color:var(--accent); font-size:20px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
    .perfil-nombre { font-size:15px; font-weight:600; color:var(--text-primary); }
    .perfil-email  { font-size:12px; color:var(--text-secondary); margin-bottom:12px; }
    .divider { height:1px; background:var(--border); margin:12px 0; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:12px; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:var(--text-secondary); }
    .info-val { font-weight:500; color:var(--text-primary); }
    .form-group { margin-bottom:12px; }
    .form-label { display:block; font-size:11px; font-weight:500; color:var(--text-secondary); margin-bottom:5px; }
    .form-input { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:7px; font-size:12px; font-family:inherit; color:var(--text-primary); background:var(--bg-page); outline:none; }
    .form-input:focus { border-color:var(--accent); }
    .pwd-bars { display:flex; gap:4px; margin-top:7px; }
    .pwd-bar { flex:1; height:4px; border-radius:2px; transition:background .3s; }
    .pwd-label { font-size:10px; margin-top:4px; min-height:14px; }
    .msg-err { font-size:11px; color:#791F1F; background:#FCEBEB; border-radius:6px; padding:7px 10px; margin-bottom:10px; }
    .msg-ok  { font-size:11px; color:#27500A; background:#EAF3DE; border-radius:6px; padding:7px 10px; margin-bottom:10px; }
    .note-info { font-size:12px; color:#0C447C; background:#E6F1FB; border-radius:7px; padding:10px 14px; }
  `]
})
export class PerfilComponent {
  fuerza      = signal(0);
  error       = signal('');
  exito       = signal(false);
  colores     = ['#E24B4A','#D85A30','#EF9F27','#1D9E75'];
  etiquetas   = ['Muy débil','Débil','Aceptable','Fuerte'];

  pwd = { actual: '', nueva: '', confirmar: '' };

  usuario     = computed(() => this.auth.usuario());
  esEstudiante = computed(() => this.auth.esEstudiante());

  iniciales = () => {
    const n = this.auth.usuario()?.nombre ?? '';
    return n.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase();
  };

  constructor(private auth: AuthService, private http: HttpClient) {}

  checkFuerza() {
    const v = this.pwd.nueva;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    this.fuerza.set(s);
  }

  cambiarPassword() {
    this.error.set(''); this.exito.set(false);
    if (!this.pwd.actual) { this.error.set('Ingresa tu contraseña actual.'); return; }
    if (this.pwd.nueva.length < 8) { this.error.set('La nueva contraseña debe tener mínimo 8 caracteres.'); return; }
    if (this.pwd.nueva !== this.pwd.confirmar) { this.error.set('Las contraseñas no coinciden.'); return; }

    this.http.patch(`${environment.apiUrl}/auth/password`, {
      passwordActual: this.pwd.actual,
      passwordNueva: this.pwd.nueva
    }).subscribe({
      next: () => {
        this.exito.set(true);
        this.pwd = { actual: '', nueva: '', confirmar: '' };
        this.fuerza.set(0);
      },
      error: (e) => this.error.set(e.error?.mensaje ?? 'Error al cambiar la contraseña.')
    });
  }

  logout() { this.auth.logout(); }
}