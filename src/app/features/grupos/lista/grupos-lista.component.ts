import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ClaseService, GrupoService } from '../../../core/services/api.services';
import { Clase, CredencialIntegrante, Grupo } from '../../../core/models';

@Component({
  selector: 'pts-grupos-lista',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Grupos</h2>
          @if (clase()) {
            <div class="page-sub">{{ clase()!.nombre }} · {{ clase()!.semestre }}</div>
          }
        </div>
        <div style="display:flex;gap:8px">
          @if (!clase()) {
            <button class="btn btn-primary" (click)="mostrarClase = true">+ Crear clase</button>
          } @else {
            <button class="btn btn-primary" (click)="mostrarGrupo = true">+ Nuevo grupo</button>
          }
        </div>
      </div>

      @if (!clase() && !cargando()) {
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <div class="empty-title">No tienes una clase creada</div>
          <div class="empty-sub">Crea tu clase para empezar a gestionar grupos.</div>
          <button class="btn btn-primary" (click)="mostrarClase = true">Crear clase</button>
        </div>
      }

      <div class="grupos-grid">
        @for (g of grupos(); track g.id) {
          <div class="grupo-card">
            <div class="grupo-nombre">{{ g.nombre }}</div>
            <div class="grupo-meta">{{ g.integrantes.length }} integrantes</div>
            @if (g.proyecto) {
              <div class="grupo-prog">
                <div class="prog-bar-sm">
                  <div class="prog-fill-sm" [style.width.%]="g.proyecto.avancePorcentaje"></div>
                </div>
                <span class="prog-pct">{{ g.proyecto.avancePorcentaje }}%</span>
              </div>
              <div class="grupo-proyecto">{{ g.proyecto.titulo }}</div>
            } @else {
              <div class="grupo-sin-proyecto">Sin proyecto</div>
            }
            <div class="grupo-actions">
              <a [routerLink]="['/grupos', g.id]" class="btn">Ver detalle →</a>
              <button class="btn btn-danger-sm" (click)="eliminarGrupo(g.id)">Eliminar</button>
            </div>
          </div>
        }
      </div>

      @if (credencialGenerada()) {
        <div class="cred-box">
          <div class="cred-title">Credenciales del usuario del grupo</div>
          <div class="cred-row"><strong>Grupo:</strong> {{ credencialGenerada()!.nombreGrupo }}</div>
          <div class="cred-row"><strong>Usuario:</strong> {{ credencialGenerada()!.nombre }}</div>
          <div class="cred-row"><strong>Email:</strong> {{ credencialGenerada()!.email }}</div>
          <div class="cred-row"><strong>Contraseña temporal:</strong> {{ credencialGenerada()!.passwordTemporal ?? 'Usuario existente (sin cambio de contraseña)' }}</div>
        </div>
      }

      @if (cargando()) {
        <div class="loading">Cargando...</div>
      }

      <!-- Modal crear clase -->
      @if (mostrarClase) {
        <div class="modal-backdrop" (click)="mostrarClase = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Nueva clase</h3>
            <input class="form-input" [(ngModel)]="formClase.nombre" placeholder="Nombre de la clase"/>
            <input class="form-input" [(ngModel)]="formClase.codigo" placeholder="Código (ej: CS101)"/>
            <input class="form-input" [(ngModel)]="formClase.semestre" placeholder="Semestre (ej: 2024-1)"/>
            <div class="modal-actions">
              <button class="btn" (click)="mostrarClase = false">Cancelar</button>
              <button class="btn btn-primary" (click)="crearClase()">Crear</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal crear grupo -->
      @if (mostrarGrupo) {
        <div class="modal-backdrop" (click)="mostrarGrupo = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Nuevo grupo</h3>
            <input class="form-input" [(ngModel)]="formGrupo.nombre" placeholder="Nombre del grupo"/>
            <input class="form-input" [(ngModel)]="formGrupo.nombreIntegrante" placeholder="Nombre del estudiante (usuario del grupo)"/>
            <input class="form-input" [(ngModel)]="formGrupo.emailIntegrante" placeholder="Email del estudiante (opcional)"/>
            <div class="modal-actions">
              <button class="btn" (click)="mostrarGrupo = false">Cancelar</button>
              <button class="btn btn-primary" (click)="crearGrupo()">Crear</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub { font-size:12px; color:var(--text-secondary); margin-top:2px; }
    .empty-state { text-align:center; padding:60px 20px; }
    .empty-icon  { font-size:40px; margin-bottom:12px; }
    .empty-title { font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:6px; }
    .empty-sub   { font-size:13px; color:var(--text-secondary); margin-bottom:18px; }
    .loading { display:flex; align-items:center; justify-content:center; height:120px; color:var(--text-secondary); }

    .grupos-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
    .grupo-card {
      background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
      padding:16px; display:flex; flex-direction:column; gap:8px;
    }
    .grupo-nombre { font-size:15px; font-weight:600; color:var(--text-primary); }
    .grupo-meta   { font-size:11px; color:var(--text-muted); }
    .grupo-proyecto { font-size:11px; color:var(--text-secondary); }
    .grupo-sin-proyecto { font-size:11px; color:var(--text-muted); font-style:italic; }
    .grupo-prog { display:flex; align-items:center; gap:8px; }
    .prog-bar-sm { flex:1; height:4px; background:var(--bg-secondary); border-radius:2px; }
    .prog-fill-sm { height:100%; border-radius:2px; background:var(--accent); }
    .prog-pct { font-size:10px; color:var(--text-muted); }
    .grupo-actions { display:flex; gap:6px; margin-top:4px; }
    .cred-box {
      margin-top:14px; padding:12px;
      border:1px solid var(--border); border-radius:10px;
      background:var(--bg-card);
    }
    .cred-title { font-size:13px; font-weight:600; margin-bottom:6px; color:var(--text-primary); }
    .cred-row { font-size:12px; color:var(--text-secondary); margin-bottom:3px; }
    .btn-danger-sm {
      padding:5px 10px; border-radius:6px; border:1px solid #E8C4C4; background:#FCEBEB;
      color:#791F1F; font-size:11px; cursor:pointer; font-family:inherit;
    }
    .btn-danger-sm:hover { background:#F8D4D4; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,0.35);
      display:flex; align-items:center; justify-content:center; z-index:200;
    }
    .modal {
      background:var(--bg-card); border-radius:12px; border:1px solid var(--border);
      padding:24px; width:360px; display:flex; flex-direction:column; gap:12px;
    }
    .modal-title { font-size:15px; font-weight:600; }
    .form-input {
      width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:7px;
      font-size:12px; font-family:inherit; color:var(--text-primary); background:var(--bg-page); outline:none;
    }
    .form-input:focus { border-color:var(--accent); }
    .modal-actions { display:flex; gap:8px; justify-content:flex-end; }
  `]
})
export class GruposListaComponent implements OnInit {
  clase    = signal<Clase | null>(null);
  grupos   = signal<Grupo[]>([]);
  cargando = signal(true);

  mostrarClase = false;
  mostrarGrupo = false;
  formClase = { nombre: '', codigo: '', semestre: '' };
  formGrupo = { nombre: '', nombreIntegrante: '', emailIntegrante: '' };
  credencialGenerada = signal<(CredencialIntegrante & { nombreGrupo: string }) | null>(null);

  constructor(
    private claseService: ClaseService,
    private grupoService: GrupoService
  ) {}

  ngOnInit() {
    this.claseService.miClase().subscribe({
      next: c => {
        this.clase.set(c);
        this.grupoService.porClase(c.id).subscribe(gs => {
          this.grupos.set(gs);
          this.cargando.set(false);
        });
      },
      error: () => this.cargando.set(false)
    });
  }

  crearClase() {
    if (!this.formClase.nombre) return;
    this.claseService.crear(this.formClase).subscribe(c => {
      this.clase.set(c);
      this.mostrarClase = false;
      this.formClase = { nombre: '', codigo: '', semestre: '' };
    });
  }

  crearGrupo() {
    const c = this.clase();
    if (!c || !this.formGrupo.nombre) return;
    this.grupoService.crear({ nombre: this.formGrupo.nombre, claseId: c.id }).subscribe(g => {
      const nombreIntegrante = this.formGrupo.nombreIntegrante.trim() || `${g.nombre} Usuario`;
      const emailIntegrante = this.formGrupo.emailIntegrante.trim() || undefined;

      this.grupoService.agregarIntegrante(g.id, {
        nombre: nombreIntegrante,
        email: emailIntegrante
      }).subscribe({
        next: cred => {
          this.grupos.update(gs => [...gs, { ...g, integrantes: [...g.integrantes, {
            id: cred.usuarioId,
            nombre: cred.nombre,
            email: cred.email,
            rol: 'ESTUDIANTE',
            grupoId: g.id
          }] }]);

          this.credencialGenerada.set({ ...cred, nombreGrupo: g.nombre });
          this.mostrarGrupo = false;
          this.formGrupo = { nombre: '', nombreIntegrante: '', emailIntegrante: '' };
        },
        error: () => {
          this.grupos.update(gs => [...gs, g]);
          this.mostrarGrupo = false;
          this.formGrupo = { nombre: '', nombreIntegrante: '', emailIntegrante: '' };
          alert('Grupo creado, pero no se pudo crear el usuario del grupo. Puedes agregarlo desde el detalle del grupo.');
        }
      });
    });
  }

  eliminarGrupo(id: number) {
    if (!confirm('¿Eliminar este grupo? Esta acción no se puede deshacer.')) return;
    this.grupoService.eliminar(id).subscribe(() => {
      this.grupos.update(gs => gs.filter(g => g.id !== id));
    });
  }
}
