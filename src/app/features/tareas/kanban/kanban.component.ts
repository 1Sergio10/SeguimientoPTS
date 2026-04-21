import { Component, OnInit, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareaService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import {
  Tarea, EstadoTarea,
  TRANSICIONES_ESTUDIANTE
} from '../../../core/models';

interface Columna {
  estado: EstadoTarea;
  label: string;
  color: string;
  bgColor: string;
}

const COLUMNAS: Columna[] = [
  { estado: 'BACKLOG',      label: 'Backlog',      color: '#5F5E5A', bgColor: '#F1EFE8' },
  { estado: 'EN_PROGRESO',  label: 'En progreso',  color: '#185FA5', bgColor: '#E6F1FB' },
  { estado: 'EN_REVISION',  label: 'En revisión',  color: '#854F0B', bgColor: '#FAEEDA' },
  { estado: 'COMPLETADO',   label: 'Completado',   color: '#3B6D11', bgColor: '#EAF3DE' },
];

@Component({
  selector: 'pts-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kanban-wrap">

      <!-- Header -->
      <div class="kanban-header">
        <h2 class="kanban-title">Tablero — Sprint {{ sprintNumero }}</h2>
        @if (esEstudiante()) {
          <button class="btn-nueva" (click)="mostrarFormNueva = true">+ Nueva tarea</button>
        }
      </div>

      <!-- Columnas -->
      <div class="kanban-board">
        @for (col of columnas; track col.estado) {
          <div class="kanban-col">
            <div class="col-header">
              <div class="col-dot" [style.background]="col.color"></div>
              <span class="col-title">{{ col.label }}</span>
              <span class="col-count">{{ tareasPor(col.estado).length }}</span>
            </div>

            <div class="col-cards">
              @for (tarea of tareasPor(col.estado); track tarea.id) {
                <div class="card" [class.card-completado]="tarea.estado === 'COMPLETADO'">
                  <div class="card-title">{{ tarea.titulo }}</div>
                  <div class="card-desc">{{ tarea.descripcion }}</div>
                  <div class="card-footer">
                    <span class="card-pts">{{ tarea.puntos }} pts</span>
                    <span class="card-autor">{{ tarea.creadaPor.nombre }}</span>
                  </div>

                  <!-- Acciones de movimiento -->
                  <div class="card-actions">
                    @if (puedeAvanzar(tarea)) {
                      <button class="btn-mover btn-avanzar"
                        (click)="moverTarea(tarea, siguienteEstado(tarea)!)">
                        {{ labelAvanzar(tarea) }} →
                      </button>
                    }
                    @if (esProfesor() && tarea.estado !== 'COMPLETADO') {
                      <button class="btn-mover btn-completar"
                        (click)="moverTarea(tarea, 'COMPLETADO')">
                        ✓ Completar
                      </button>
                    }
                  </div>
                </div>
              }

              @if (col.estado === 'BACKLOG' && esEstudiante()) {
                <div class="col-add-hint">+ Crea tu primera tarea</div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Modal nueva tarea -->
      @if (mostrarFormNueva) {
        <div class="modal-backdrop" (click)="mostrarFormNueva = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Nueva tarea</h3>
            <input class="form-input" [(ngModel)]="nuevaTarea.titulo"
              placeholder="Título de la tarea" />
            <textarea class="form-input form-textarea"
              [(ngModel)]="nuevaTarea.descripcion"
              placeholder="Descripción breve"></textarea>
            <div class="form-row">
              <label class="form-label">Puntos de esfuerzo</label>
              <select class="form-input form-select" [(ngModel)]="nuevaTarea.puntos">
                <option [value]="1">1 — Trivial</option>
                <option [value]="2">2 — Pequeña</option>
                <option [value]="3">3 — Media</option>
                <option [value]="5">5 — Grande</option>
                <option [value]="8">8 — Muy grande</option>
              </select>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="mostrarFormNueva = false">Cancelar</button>
              <button class="btn-crear" (click)="crearTarea()" [disabled]="!nuevaTarea.titulo">
                Crear tarea
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .kanban-wrap { padding: 24px; height: 100%; display: flex; flex-direction: column; }

    .kanban-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .kanban-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .btn-nueva {
      padding: 7px 16px; border-radius: 7px;
      background: var(--accent); color: #fff; border: none;
      font-size: 13px; font-weight: 500; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-nueva:hover { background: var(--accent-dark); }

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      flex: 1;
      overflow-x: auto;
    }

    .kanban-col {
      background: var(--bg-secondary);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      min-height: 300px;
    }
    .col-header {
      display: flex; align-items: center; gap: 7px; margin-bottom: 12px;
    }
    .col-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .col-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); flex: 1; }
    .col-count { font-size: 11px; background: var(--bg-page); color: var(--text-muted); border-radius: 10px; padding: 1px 7px; }

    .col-cards { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .col-add-hint { font-size: 12px; color: var(--text-muted); text-align: center; padding: 16px 0; }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      transition: border-color 0.15s;
    }
    .card:hover { border-color: var(--border-strong); }
    .card-completado { opacity: 0.7; }
    .card-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; line-height: 1.4; }
    .card-desc  { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; }
    .card-footer {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 11px; color: var(--text-muted);
    }
    .card-pts  { background: var(--bg-secondary); border-radius: 4px; padding: 1px 6px; }
    .card-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }

    .btn-mover {
      font-size: 11px; font-weight: 500; border-radius: 5px;
      padding: 3px 9px; border: 1px solid; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-avanzar  { background: #E6F1FB; color: #185FA5; border-color: #378ADD; }
    .btn-avanzar:hover  { background: #B5D4F4; }
    .btn-completar { background: #EAF3DE; color: #3B6D11; border-color: #639922; }
    .btn-completar:hover { background: #C0DD97; }

    /* Modal */
    .modal-backdrop {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
    }
    .modal {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border);
      padding: 24px;
      width: 380px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .modal-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .form-input {
      width: 100%; padding: 9px 12px;
      border: 1px solid var(--border); border-radius: 7px;
      background: var(--bg-page); color: var(--text-primary);
      font-size: 13px; outline: none; font-family: inherit;
    }
    .form-input:focus { border-color: var(--accent); }
    .form-textarea { resize: vertical; min-height: 72px; }
    .form-row { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
    .form-select { cursor: pointer; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
    .btn-cancel {
      padding: 7px 16px; border-radius: 7px; font-size: 13px;
      background: none; border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer;
    }
    .btn-crear {
      padding: 7px 16px; border-radius: 7px; font-size: 13px; font-weight: 500;
      background: var(--accent); color: #fff; border: none; cursor: pointer;
    }
    .btn-crear:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class KanbanComponent implements OnInit {
  @Input() sprintId!: number | string;
  @Input() sprintNumero = 1;

  columnas = COLUMNAS;
  tareas = signal<Tarea[]>([]);
  mostrarFormNueva = false;
  nuevaTarea = { titulo: '', descripcion: '', puntos: 3 };

  esProfesor() { return this.auth.esProfesor(); }
  esEstudiante() { return this.auth.esEstudiante(); }

  constructor(
    private tareaService: TareaService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.cargarTareas();
  }

  cargarTareas() {
    const sprintId = Number(this.sprintId);
    if (!Number.isFinite(sprintId) || sprintId <= 0) {
      this.tareas.set([]);
      return;
    }
    this.tareaService.porSprint(sprintId).subscribe(t => this.tareas.set(t));
  }

  tareasPor(estado: EstadoTarea): Tarea[] {
    return this.tareas().filter(t => t.estado === estado);
  }

  // R3: calcula el siguiente estado permitido para el estudiante
  siguienteEstado(tarea: Tarea): EstadoTarea | null {
    if (this.esProfesor()) return null;
    return TRANSICIONES_ESTUDIANTE[tarea.estado];
  }

  // R2/R3: el estudiante solo puede avanzar si hay siguiente estado y no es COMPLETADO
  puedeAvanzar(tarea: Tarea): boolean {
    if (this.esProfesor()) return false;
    const sig = TRANSICIONES_ESTUDIANTE[tarea.estado];
    return sig !== null;
  }

  labelAvanzar(tarea: Tarea): string {
    const siguiente = TRANSICIONES_ESTUDIANTE[tarea.estado];
    const labels: Record<EstadoTarea, string> = {
      BACKLOG:     'Iniciar',
      EN_PROGRESO: 'Enviar a revisión',
      EN_REVISION: '',
      COMPLETADO:  '',
    };
    return labels[tarea.estado];
  }

  moverTarea(tarea: Tarea, estado: EstadoTarea) {
    this.tareaService.moverEstado(tarea.id, { estado }).subscribe(() => {
      this.tareas.update(ts => ts.map(t => t.id === tarea.id ? { ...t, estado } : t));
    });
  }

  crearTarea() {
    if (!this.nuevaTarea.titulo.trim()) return;
    const dto = { ...this.nuevaTarea, sprintId: Number(this.sprintId) };
    this.tareaService.crear(dto).subscribe(t => {
      this.tareas.update(ts => [...ts, t]);
      this.nuevaTarea = { titulo: '', descripcion: '', puntos: 3 };
      this.mostrarFormNueva = false;
    });
  }
}