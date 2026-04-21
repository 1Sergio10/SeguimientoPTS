import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/api.services';
import { DashboardProfesorDto, DashboardEstudianteDto } from '../../core/models';

@Component({
  selector: 'pts-dashboard',
  standalone: true,
  imports: [RouterLink],
  providers: [DashboardService],
  template: `
    @if (esProfesor()) {
      <!-- ── DASHBOARD PROFESOR ── -->
      @if (datosProfesor()) {
        <div class="page">
          <div class="page-header">
            <div>
              <h2 class="page-title">Dashboard</h2>
              <div class="page-sub">{{ datosProfesor()!.clase.nombre }} · {{ datosProfesor()!.clase.semestre }}</div>
            </div>
            <a routerLink="/sprints" class="btn btn-primary">Ver Sprints →</a>
          </div>

          <div class="metrics">
            <div class="mc"><div class="mc-label">Grupos</div><div class="mc-val">{{ datosProfesor()!.totalGrupos }}</div></div>
            <div class="mc"><div class="mc-label">En revisión</div><div class="mc-val">{{ datosProfesor()!.tareasEnRevision }}</div></div>
            <div class="mc"><div class="mc-label">Avance general</div><div class="mc-val">{{ datosProfesor()!.avanceGeneral }}%</div></div>
          </div>

          <div class="card">
            <div class="card-title">Avance por grupo</div>
            @for (g of datosProfesor()!.grupos; track g.grupoId) {
              <div class="prog-row">
                <div class="prog-label">{{ g.nombreGrupo }}</div>
                <div class="prog-bar"><div class="prog-fill" [style.width.%]="g.avancePorcentaje"></div></div>
                <div class="prog-pct">{{ g.avancePorcentaje }}%</div>
                <span class="badge" [class]="'badge-' + g.estado.toLowerCase().replace('_','-')">
                  {{ g.estado === 'AL_DIA' ? 'Al día' : g.estado === 'EN_RIESGO' ? 'En riesgo' : 'Retrasado' }}
                </span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="loading">Cargando dashboard...</div>
      }
    } @else {
      <!-- ── DASHBOARD ESTUDIANTE ── -->
      @if (datosEstudiante()) {
        <div class="page">
          <div class="page-header">
            <div>
              <h2 class="page-title">Mi proyecto</h2>
              <div class="page-sub">{{ datosEstudiante()!.grupo.nombre }} · {{ datosEstudiante()!.proyecto.titulo }}</div>
            </div>
          </div>

          <div class="metrics">
            <div class="mc"><div class="mc-label">Sprint actual</div><div class="mc-val">Sprint {{ datosEstudiante()!.sprintActual?.numero ?? '—' }}</div></div>
            <div class="mc"><div class="mc-label">Tareas activas</div><div class="mc-val">{{ datosEstudiante()!.tareasActivas }}</div></div>
            <div class="mc"><div class="mc-label">Completadas</div><div class="mc-val">{{ datosEstudiante()!.tareasCompletadas }}</div></div>
            <div class="mc"><div class="mc-label">Avance</div><div class="mc-val">{{ datosEstudiante()!.avancePorcentaje }}%</div></div>
          </div>

          <div class="card">
            <div class="card-title">{{ datosEstudiante()!.proyecto.titulo }}</div>
            <div class="prog-row">
              <div class="prog-label">Avance global</div>
              <div class="prog-bar"><div class="prog-fill" [style.width.%]="datosEstudiante()!.avancePorcentaje"></div></div>
              <div class="prog-pct">{{ datosEstudiante()!.avancePorcentaje }}%</div>
            </div>
            <div class="card-actions">
              @if (datosEstudiante()!.sprintActual) {
                <a [routerLink]="['/kanban', datosEstudiante()!.sprintActual!.id]" class="btn btn-primary">Ir al Kanban →</a>
              }
              <a routerLink="/sprints" class="btn">Ver sprints</a>
            </div>
          </div>
        </div>
      } @else {
        <div class="loading">Cargando dashboard...</div>
      }
    }
  `,
  styles: [`
    .loading { display:flex; align-items:center; justify-content:center; height:200px; color:var(--text-secondary); }
    .page-sub { font-size:12px; color:var(--text-secondary); margin-top:2px; }
    .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin-bottom:18px; }
    .mc { background:var(--bg-secondary); border-radius:8px; padding:12px 14px; }
    .mc-label { font-size:11px; color:var(--text-secondary); margin-bottom:4px; }
    .mc-val { font-size:20px; font-weight:600; color:var(--text-primary); }
    .prog-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
    .prog-label { font-size:12px; color:var(--text-secondary); width:110px; flex-shrink:0; }
    .prog-bar { flex:1; height:5px; background:var(--bg-secondary); border-radius:3px; }
    .prog-fill { height:100%; border-radius:3px; background:var(--accent); }
    .prog-pct { font-size:11px; color:var(--text-secondary); width:32px; text-align:right; }
    .card-actions { display:flex; gap:8px; margin-top:14px; padding-top:12px; border-top:1px solid var(--border); }
    .badge { font-size:10px; font-weight:500; border-radius:5px; padding:2px 7px; margin-left:4px; }
    .badge-al-dia { background:#EAF3DE; color:#27500A; }
    .badge-en-riesgo { background:#FAEEDA; color:#633806; }
    .badge-retrasado { background:#FCEBEB; color:#791F1F; }
  `]
})
export class DashboardComponent implements OnInit {
  esProfesor() { return this.auth.esProfesor(); }
  datosProfesor     = signal<DashboardProfesorDto | null>(null);
  datosEstudiante   = signal<DashboardEstudianteDto | null>(null);

  constructor(private auth: AuthService, private dashboard: DashboardService) {}

  ngOnInit() {
    if (this.esProfesor()) {
      this.dashboard.resumenProfesor().subscribe(d => this.datosProfesor.set(d));
    } else {
      this.dashboard.resumenEstudiante().subscribe(d => this.datosEstudiante.set(d));
    }
  }
}