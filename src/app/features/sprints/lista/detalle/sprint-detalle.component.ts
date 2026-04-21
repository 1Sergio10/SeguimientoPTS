import { Component, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { SprintService, TareaService } from '../../../../core/services/api.services';
import { Sprint, Tarea, EstadoTarea } from '../../../../core/models';

@Component({
  selector: 'pts-sprint-detalle',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page">
      @if (sprint()) {
        <div class="page-header">
          <div>
            <h2 class="page-title">Sprint {{ sprint()!.numero }}</h2>
            <div class="page-sub">
              {{ sprint()!.fechaInicio | date:'d MMM' }} –
              {{ sprint()!.fechaFin | date:'d MMM yyyy' }}
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <a [routerLink]="['/kanban', sprint()!.id]" class="btn btn-primary">Ver Kanban →</a>
            @if (esProfesor() && !sprint()!.cerrado) {
              <button class="btn" (click)="abrirEditarSprint()">Editar sprint</button>
            }
            @if (esProfesor() && !sprint()!.cerrado) {
              <button class="btn" (click)="cerrar()">Cerrar sprint</button>
            }
          </div>
        </div>

        <div class="sprint-meta-box">
          <span class="meta-label">Meta:</span> {{ sprint()!.meta }}
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div class="card-title" style="margin:0">Tareas</div>
            @if (esEstudiante()) {
              <button class="btn btn-primary" (click)="mostrarForm = !mostrarForm">
                + Nueva tarea
              </button>
            }
          </div>

          @if (mostrarForm) {
            <div class="form-nueva-tarea">
              <input class="form-input" [(ngModel)]="form.titulo" placeholder="Título de la tarea"/>
              <textarea class="form-input" [(ngModel)]="form.descripcion"
                placeholder="Descripción" style="resize:vertical;min-height:56px"></textarea>
              <select class="form-input" [(ngModel)]="form.puntos">
                <option [value]="1">1 — Trivial</option>
                <option [value]="2">2 — Pequeña</option>
                <option [value]="3">3 — Media</option>
                <option [value]="5">5 — Grande</option>
                <option [value]="8">8 — Muy grande</option>
              </select>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button class="btn" (click)="mostrarForm = false">Cancelar</button>
                <button class="btn btn-primary" (click)="crearTarea()">Crear</button>
              </div>
            </div>
          }

          <table class="spr-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Creada por</th>
                <th>Estado</th>
                <th>Pts</th>
                @if (esProfesor()) { <th></th> }
              </tr>
            </thead>
            <tbody>
              @for (t of tareas(); track t.id) {
                <tr>
                  <td>{{ t.titulo }}</td>
                  <td>{{ t.creadaPor.nombre }}</td>
                  <td>
                    <span class="badge"
                      [class.badge-backlog]="t.estado === 'BACKLOG'"
                      [class.badge-en-progreso]="t.estado === 'EN_PROGRESO'"
                      [class.badge-en-revision]="t.estado === 'EN_REVISION'"
                      [class.badge-completado]="t.estado === 'COMPLETADO'">
                      {{ estadoLabel(t.estado) }}
                    </span>
                  </td>
                  <td>{{ t.puntos }}</td>
                  @if (esProfesor()) {
                    <td>
                      <button class="btn-comp" style="margin-right:6px" (click)="abrirEditarTarea(t)">Editar</button>
                      @if (t.estado === 'EN_REVISION') {
                        <button class="btn-comp" (click)="completar(t)">✓ Completar</button>
                      }
                      <button class="btn-del" (click)="eliminarTarea(t)">Eliminar</button>
                    </td>
                  }
                </tr>
              }
              @if (tareas().length === 0) {
                <tr><td colspan="5" class="empty-cell">No hay tareas aún.</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (mostrarEditarSprint) {
          <div class="modal-backdrop" (click)="mostrarEditarSprint = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 class="modal-title">Editar sprint</h3>
              <input class="form-input" type="number" [(ngModel)]="formSprintEdit.numero" placeholder="Numero"/>
              <input class="form-input" [(ngModel)]="formSprintEdit.meta" placeholder="Meta"/>
              <input class="form-input" type="date" [(ngModel)]="formSprintEdit.fechaInicio" />
              <input class="form-input" type="date" [(ngModel)]="formSprintEdit.fechaFin" />
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button class="btn" (click)="mostrarEditarSprint = false">Cancelar</button>
                <button class="btn btn-primary" (click)="guardarEditarSprint()">Guardar</button>
              </div>
            </div>
          </div>
        }

        @if (mostrarEditarTarea) {
          <div class="modal-backdrop" (click)="mostrarEditarTarea = false">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 class="modal-title">Editar tarea</h3>
              <input class="form-input" [(ngModel)]="formTareaEdit.titulo" placeholder="Titulo"/>
              <textarea class="form-input" [(ngModel)]="formTareaEdit.descripcion" placeholder="Descripcion" style="resize:vertical;min-height:56px"></textarea>
              <select class="form-input" [(ngModel)]="formTareaEdit.puntos">
                <option [value]="1">1 — Trivial</option>
                <option [value]="2">2 — Pequena</option>
                <option [value]="3">3 — Media</option>
                <option [value]="5">5 — Grande</option>
                <option [value]="8">8 — Muy grande</option>
              </select>
              <div style="display:flex;gap:8px;justify-content:flex-end">
                <button class="btn" (click)="mostrarEditarTarea = false">Cancelar</button>
                <button class="btn btn-primary" (click)="guardarEditarTarea()">Guardar</button>
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="loading">Cargando sprint...</div>
      }
    </div>
  `,
  styles: [`
    .page-sub{font-size:12px;color:var(--text-secondary);margin-top:2px}
    .sprint-meta-box{font-size:12px;color:var(--text-secondary);background:var(--bg-secondary);border-radius:7px;padding:9px 14px;margin-bottom:14px}
    .meta-label{font-weight:500;color:var(--text-primary)}
    .spr-table{width:100%;border-collapse:collapse;font-size:12px}
    .spr-table th{text-align:left;font-size:10px;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;padding:5px 8px;border-bottom:1px solid var(--border)}
    .spr-table td{padding:8px;border-bottom:1px solid var(--border);color:var(--text-primary);vertical-align:middle}
    .spr-table tr:last-child td{border-bottom:none}
    .spr-table tr:hover td{background:var(--bg-secondary)}
    .badge{font-size:10px;font-weight:500;border-radius:5px;padding:2px 7px}
    .badge-backlog{background:#F1EFE8;color:#5F5E5A}
    .badge-en-progreso{background:#E6F1FB;color:#0C447C}
    .badge-en-revision{background:#FAEEDA;color:#633806}
    .badge-completado{background:#EAF3DE;color:#27500A}
    .btn-comp{font-size:10px;font-weight:500;border-radius:4px;padding:2px 8px;border:0.5px solid #97C459;background:#EAF3DE;color:#27500A;cursor:pointer;font-family:inherit}
    .btn-comp:hover{opacity:.75}
    .btn-del{font-size:10px;font-weight:500;border-radius:4px;padding:2px 8px;border:0.5px solid #E8C4C4;background:#FCEBEB;color:#791F1F;cursor:pointer;font-family:inherit;margin-left:6px}
    .btn-del:hover{opacity:.75}
    .empty-cell{text-align:center;color:var(--text-secondary);padding:20px}
    .loading{display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-secondary)}
    .form-nueva-tarea{display:flex;flex-direction:column;gap:8px;background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:14px}
    .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:200}
    .modal{background:var(--bg-card);border-radius:12px;border:1px solid var(--border);padding:24px;width:360px;display:flex;flex-direction:column;gap:12px}
    .modal-title{font-size:15px;font-weight:600}
    .form-input{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:7px;font-size:12px;font-family:inherit;color:var(--text-primary);background:var(--bg-page);outline:none}
    .form-input:focus{border-color:var(--accent)}
  `]
})
export class SprintDetalleComponent implements OnInit {
  @Input() id!: number;

  sprint      = signal<Sprint | null>(null);
  tareas      = signal<Tarea[]>([]);
  mostrarForm = false;
  mostrarEditarSprint = false;
  mostrarEditarTarea = false;
  form        = { titulo: '', descripcion: '', puntos: 3 };
  formSprintEdit = { numero: 1, meta: '', fechaInicio: '', fechaFin: '' };
  tareaEditId: number | null = null;
  formTareaEdit = { titulo: '', descripcion: '', puntos: 3 };

  // Declarar auth ANTES de usarlo en las propiedades
  constructor(
    private auth: AuthService,
    private sprintService: SprintService,
    private tareaService: TareaService
  ) {}

  get esProfesor()   { return this.auth.esProfesor; }
  get esEstudiante() { return this.auth.esEstudiante; }

  ngOnInit() {
    if (this.id) {
      this.sprintService.obtener(this.id).subscribe(s => {
        this.sprint.set(s);
        this.formSprintEdit = {
          numero: s.numero,
          meta: s.meta,
          fechaInicio: s.fechaInicio,
          fechaFin: s.fechaFin
        };
      });
      this.tareaService.porSprint(this.id).subscribe(t => this.tareas.set(t));
    }
  }

  estadoLabel(e: EstadoTarea): string {
    const labels: Record<EstadoTarea, string> = {
      BACKLOG: 'Backlog', EN_PROGRESO: 'En progreso',
      EN_REVISION: 'En revisión', COMPLETADO: 'Completado'
    };
    return labels[e];
  }

  crearTarea() {
    if (!this.form.titulo.trim()) return;
    this.tareaService.crear({ ...this.form, sprintId: this.id }).subscribe(t => {
      this.tareas.update(ts => [...ts, t]);
      this.mostrarForm = false;
      this.form = { titulo: '', descripcion: '', puntos: 3 };
    });
  }

  completar(tarea: Tarea) {
    this.tareaService.moverEstado(tarea.id, { estado: 'COMPLETADO' }).subscribe(() => {
      this.tareas.update(ts =>
        ts.map(t => t.id === tarea.id ? { ...t, estado: 'COMPLETADO' as EstadoTarea } : t)
      );
    });
  }

  cerrar() {
    const s = this.sprint();
    if (!s) return;
    this.sprintService.cerrar(s.id).subscribe(() => {
      this.sprint.update(sp => sp ? { ...sp, cerrado: true } : sp);
    });
  }

  abrirEditarSprint() {
    const s = this.sprint();
    if (!s) return;
    this.formSprintEdit = {
      numero: s.numero,
      meta: s.meta,
      fechaInicio: s.fechaInicio,
      fechaFin: s.fechaFin
    };
    this.mostrarEditarSprint = true;
  }

  guardarEditarSprint() {
    const s = this.sprint();
    if (!s) return;

    this.sprintService.editar(s.id, this.formSprintEdit).subscribe(updated => {
      this.sprint.set(updated);
      this.mostrarEditarSprint = false;
    });
  }

  abrirEditarTarea(t: Tarea) {
    this.tareaEditId = t.id;
    this.formTareaEdit = {
      titulo: t.titulo,
      descripcion: t.descripcion,
      puntos: t.puntos
    };
    this.mostrarEditarTarea = true;
  }

  guardarEditarTarea() {
    if (!this.tareaEditId) return;

    this.tareaService.editar(this.tareaEditId, {
      titulo: this.formTareaEdit.titulo,
      descripcion: this.formTareaEdit.descripcion,
      puntos: this.formTareaEdit.puntos,
      sprintId: this.id,
      asignadoAId: undefined
    }).subscribe(updated => {
      this.tareas.update(ts => ts.map(t => t.id === updated.id ? updated : t));
      this.mostrarEditarTarea = false;
      this.tareaEditId = null;
    });
  }

  eliminarTarea(t: Tarea) {
    if (!confirm(`Eliminar la tarea "${t.titulo}"?`)) return;

    this.tareaService.eliminar(t.id).subscribe(() => {
      this.tareas.update(ts => ts.filter(x => x.id !== t.id));
    });
  }
}