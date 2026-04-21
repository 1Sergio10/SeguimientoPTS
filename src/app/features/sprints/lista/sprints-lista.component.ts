import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ClaseService, GrupoService, ProyectoService, SprintService } from '../../../core/services/api.services';
import { Sprint, CrearSprintDto } from '../../../core/models';

@Component({
  selector: 'pts-sprints-lista',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h2 class="page-title">Sprints</h2>
        @if (esProfesor()) {
          <button class="btn btn-primary" (click)="mostrarForm = true">+ Nuevo sprint</button>
        }
      </div>

      @if (cargando()) {
        <div class="loading">Cargando sprints...</div>
      } @else if (sprints().length === 0) {
        <div class="empty-state">
          <div class="empty-title">No hay sprints aún</div>
          @if (esProfesor()) {
            <div class="empty-sub">Crea el primer sprint para comenzar.</div>
          } @else {
            <div class="empty-sub">El profesor aún no ha creado sprints.</div>
          }
        </div>
      } @else {
        <div class="sprints-list">
          @for (s of sprints(); track s.id) {
            <div class="sprint-card" (click)="irASprint(s.id)">
              <div class="sprint-header">
                <div class="sprint-num">Sprint {{ s.numero }}</div>
                @if (s.cerrado) {
                  <span class="badge badge-cerrado">Cerrado</span>
                } @else {
                  <span class="badge badge-activo">Activo</span>
                }
              </div>
              <div class="sprint-meta">{{ s.meta }}</div>
              <div class="sprint-dates">
                {{ s.fechaInicio | date:'d MMM' }} – {{ s.fechaFin | date:'d MMM yyyy' }}
              </div>
              <div class="sprint-progress">
                <div class="prog-bar">
                  <div class="prog-fill" [style.width.%]="avance(s)"></div>
                </div>
                <span class="prog-pct">{{ s.tareasCompletadas }}/{{ s.tareasTotal }}</span>
              </div>
            </div>
          }
        </div>
      }

      @if (mostrarForm) {
        <div class="modal-backdrop" (click)="mostrarForm = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Nuevo Sprint</h3>
            <div class="form-group">
              <label class="form-label">Número</label>
              <input class="form-input" type="number" [(ngModel)]="form.numero" placeholder="1"/>
            </div>
            <div class="form-group">
              <label class="form-label">Meta del sprint</label>
              <input class="form-input" [(ngModel)]="form.meta" placeholder="Objetivo principal..."/>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Inicio</label>
                <input class="form-input" type="date" [(ngModel)]="form.fechaInicio"/>
              </div>
              <div class="form-group">
                <label class="form-label">Fin</label>
                <input class="form-input" type="date" [(ngModel)]="form.fechaFin"/>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn" (click)="mostrarForm = false">Cancelar</button>
              <button class="btn btn-primary" (click)="crearSprint()">Crear sprint</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .loading { display:flex; align-items:center; justify-content:center; height:120px; color:var(--text-secondary); }
    .empty-state { text-align:center; padding:50px 20px; }
    .empty-title { font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:6px; }
    .empty-sub   { font-size:12px; color:var(--text-secondary); }

    .sprints-list { display:flex; flex-direction:column; gap:10px; }
    .sprint-card {
      background:var(--bg-card); border:1px solid var(--border); border-radius:10px;
      padding:14px 16px; cursor:pointer; transition:border-color .15s;
    }
    .sprint-card:hover { border-color:var(--accent); }
    .sprint-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
    .sprint-num  { font-size:14px; font-weight:600; color:var(--text-primary); flex:1; }
    .sprint-meta { font-size:12px; color:var(--text-secondary); margin-bottom:6px; }
    .sprint-dates { font-size:11px; color:var(--text-muted); margin-bottom:10px; }
    .sprint-progress { display:flex; align-items:center; gap:8px; }
    .prog-bar { flex:1; height:4px; background:var(--bg-secondary); border-radius:2px; }
    .prog-fill { height:100%; border-radius:2px; background:var(--accent); }
    .prog-pct { font-size:11px; color:var(--text-muted); }

    .badge { font-size:10px; font-weight:500; border-radius:5px; padding:2px 7px; }
    .badge-activo  { background:#EAF3DE; color:#27500A; }
    .badge-cerrado { background:#F1EFE8; color:#5F5E5A; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,0.35);
      display:flex; align-items:center; justify-content:center; z-index:200;
    }
    .modal {
      background:var(--bg-card); border-radius:12px; border:1px solid var(--border);
      padding:24px; width:380px; display:flex; flex-direction:column; gap:12px;
    }
    .modal-title { font-size:15px; font-weight:600; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    .form-label { font-size:11px; font-weight:500; color:var(--text-secondary); }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .form-input {
      width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:7px;
      font-size:12px; font-family:inherit; color:var(--text-primary); background:var(--bg-page); outline:none; box-sizing:border-box;
    }
    .form-input:focus { border-color:var(--accent); }
    .modal-actions { display:flex; gap:8px; justify-content:flex-end; }
  `]
})
export class SprintsListaComponent implements OnInit {
  sprints  = signal<Sprint[]>([]);
  cargando = signal(true);
  proyectoId = signal<number | null>(null);

  esProfesor() { return this.auth.esProfesor(); }
  esEstudiante() { return this.auth.esEstudiante(); }

  mostrarForm = false;
  form = { numero: 1, meta: '', fechaInicio: '', fechaFin: '', proyectoId: 0 };

  constructor(
    private auth: AuthService,
    private claseService: ClaseService,
    private grupoService: GrupoService,
    private proyectoService: ProyectoService,
    private sprintService: SprintService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.auth.esEstudiante()) {
      const grupoId = this.auth.usuario()?.grupoId;
      if (!grupoId) { this.cargando.set(false); return; }
      this.proyectoService.porGrupo(grupoId).subscribe({
        next: p => {
          this.proyectoId.set(p.id);
          this.form.proyectoId = p.id;
          this.sprintService.porProyecto(p.id).subscribe(ss => {
            this.sprints.set(ss);
            this.cargando.set(false);
          });
        },
        error: () => this.cargando.set(false)
      });
    } else {
      this.claseService.miClase().subscribe({
        next: c => {
          this.grupoService.porClase(c.id).subscribe(grupos => {
            if (grupos.length === 0) { this.cargando.set(false); return; }
            const g = grupos[0];
            if (g.proyecto) {
              this.proyectoId.set(g.proyecto.id);
              this.form.proyectoId = g.proyecto.id;
              this.sprintService.porProyecto(g.proyecto.id).subscribe(ss => {
                this.sprints.set(ss);
                this.cargando.set(false);
              });
            } else {
              this.cargando.set(false);
            }
          });
        },
        error: () => this.cargando.set(false)
      });
    }
  }

  crearSprint() {
    if (!this.form.meta || !this.form.fechaInicio || !this.form.fechaFin) return;
    const dto: CrearSprintDto = {
      numero: this.form.numero,
      proyectoId: this.form.proyectoId,
      meta: this.form.meta,
      fechaInicio: this.form.fechaInicio,
      fechaFin: this.form.fechaFin
    };
    this.sprintService.crear(dto).subscribe(s => {
      this.sprints.update(ss => [...ss, s]);
      this.mostrarForm = false;
      this.form = { numero: this.sprints().length + 1, meta: '', fechaInicio: '', fechaFin: '', proyectoId: this.form.proyectoId };
    });
  }

  irASprint(id: number) {
    this.router.navigate(['/sprints', id]);
  }

  avance(s: Sprint): number {
    return s.tareasTotal > 0 ? Math.round(s.tareasCompletadas * 100 / s.tareasTotal) : 0;
  }
}
