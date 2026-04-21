import { Component, OnInit, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { GrupoService, ProyectoService } from '../../../core/services/api.services';
import { CredencialIntegrante, Grupo, Proyecto } from '../../../core/models';

@Component({
  selector: 'pts-grupo-detalle',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page">
      @if (grupo()) {
        <div class="page-header">
          <div>
            <h2 class="page-title">{{ grupo()!.nombre }}</h2>
            <div class="page-sub">{{ grupo()!.integrantes.length }} integrantes</div>
          </div>
          @if (esProfesor()) {
            <button class="btn" (click)="mostrarEditar = true">Editar nombre</button>
          }
        </div>

        <!-- Integrantes -->
        <div class="card" style="margin-bottom:14px">
          <div class="card-header">
            <div class="card-title">Integrantes</div>
            @if (esProfesor()) {
              <button class="btn btn-sm" (click)="mostrarAgregar = true">+ Agregar</button>
            }
          </div>
          <div class="members-list">
            @for (u of grupo()!.integrantes; track u.id) {
              <div class="member-row">
                <div class="member-av">{{ iniciales(u.nombre) }}</div>
                <div class="member-info">
                  <div class="member-name">{{ u.nombre }}</div>
                  <div class="member-email">{{ u.email }}</div>
                </div>
                @if (esProfesor()) {
                  <button class="btn-remove" (click)="removerIntegrante(u.id)" title="Remover">✕</button>
                }
              </div>
            }
            @if (grupo()!.integrantes.length === 0) {
              <div class="empty-members">Sin integrantes asignados.</div>
            }
          </div>

          @if (credencialGenerada()) {
            <div class="cred-box">
              <div class="cred-title">Credenciales del integrante</div>
              <div class="cred-row"><strong>Nombre:</strong> {{ credencialGenerada()!.nombre }}</div>
              <div class="cred-row"><strong>Email:</strong> {{ credencialGenerada()!.email }}</div>
              <div class="cred-row"><strong>Contraseña temporal:</strong> {{ credencialGenerada()!.passwordTemporal ?? 'Usuario existente (sin cambio de contraseña)' }}</div>
            </div>
          }
        </div>

        <!-- Proyecto -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Proyecto</div>
          </div>
          @if (proyecto()) {
            <div class="project-info">
              <div class="project-title">{{ proyecto()!.titulo }}</div>
              <div class="project-desc">{{ proyecto()!.descripcion }}</div>
              <div class="project-meta">
                <span class="badge badge-{{ proyecto()!.estado.toLowerCase() }}">{{ proyecto()!.estado }}</span>
                <span class="project-avance">{{ proyecto()!.avancePorcentaje }}% completado</span>
              </div>
              <div style="display:flex;gap:8px;margin-top:12px">
                <a routerLink="/sprints" class="btn">Ver sprints</a>
                 <a routerLink="/sprints" class="btn btn-primary">Ir al tablero →</a>
              </div>
            </div>
          } @else if (esEstudiante()) {
            <div class="no-project">
              <div class="no-proj-msg">Tu grupo no tiene proyecto aún.</div>
              <button class="btn btn-primary" (click)="mostrarProyecto = true">Crear proyecto</button>
            </div>
          } @else {
            <div class="no-project">Este grupo no tiene proyecto todavía.</div>
          }
        </div>
      } @else {
        <div class="loading">Cargando grupo...</div>
      }

      <!-- Modal editar nombre -->
      @if (mostrarEditar) {
        <div class="modal-backdrop" (click)="mostrarEditar = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Editar nombre</h3>
            <input class="form-input" [(ngModel)]="nuevoNombre" placeholder="Nuevo nombre del grupo"/>
            <div class="modal-actions">
              <button class="btn" (click)="mostrarEditar = false">Cancelar</button>
              <button class="btn btn-primary" (click)="editarGrupo()">Guardar</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal agregar integrante -->
      @if (mostrarAgregar) {
        <div class="modal-backdrop" (click)="mostrarAgregar = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Agregar integrante</h3>
            <input class="form-input" [(ngModel)]="formIntegrante.nombre" placeholder="Nombre del estudiante"/>
            <input class="form-input" [(ngModel)]="formIntegrante.email" placeholder="Email (opcional)"/>
            <div class="modal-actions">
              <button class="btn" (click)="mostrarAgregar = false">Cancelar</button>
              <button class="btn btn-primary" (click)="agregarIntegrante()">Agregar</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal crear proyecto -->
      @if (mostrarProyecto) {
        <div class="modal-backdrop" (click)="mostrarProyecto = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Crear proyecto</h3>
            <input class="form-input" [(ngModel)]="formProyecto.titulo" placeholder="Título del proyecto"/>
            <textarea class="form-input" style="resize:vertical;min-height:60px"
              [(ngModel)]="formProyecto.descripcion" placeholder="Descripción breve"></textarea>
            <div class="modal-actions">
              <button class="btn" (click)="mostrarProyecto = false">Cancelar</button>
              <button class="btn btn-primary" (click)="crearProyecto()">Crear</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub  { font-size:12px; color:var(--text-secondary); margin-top:2px; }
    .loading   { display:flex; align-items:center; justify-content:center; height:200px; color:var(--text-secondary); }
    .card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .btn-sm { padding:4px 10px; font-size:11px; }
    .members-list { display:flex; flex-direction:column; gap:8px; }
    .member-row {
      display:flex; align-items:center; gap:10px;
      padding:8px 0; border-bottom:1px solid var(--border);
    }
    .member-row:last-child { border-bottom:none; }
    .member-av {
      width:30px; height:30px; border-radius:50%; background:var(--accent-light);
      color:var(--accent); font-size:10px; font-weight:700;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .member-info { flex:1; }
    .member-name  { font-size:12px; font-weight:500; color:var(--text-primary); }
    .member-email { font-size:11px; color:var(--text-muted); }
    .btn-remove {
      background:none; border:none; cursor:pointer; color:var(--text-muted);
      font-size:12px; padding:4px; border-radius:4px; transition:color .15s;
    }
    .btn-remove:hover { color:var(--danger-text); }
    .empty-members { font-size:12px; color:var(--text-muted); padding:8px 0; }
    .cred-box {
      margin-top: 10px; padding: 10px;
      border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg-page);
    }
    .cred-title { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .cred-row { font-size: 11px; color: var(--text-secondary); margin-bottom: 3px; }

    .project-info { display:flex; flex-direction:column; gap:6px; }
    .project-title { font-size:15px; font-weight:600; color:var(--text-primary); }
    .project-desc  { font-size:12px; color:var(--text-secondary); }
    .project-meta  { display:flex; align-items:center; gap:10px; }
    .project-avance { font-size:12px; color:var(--text-muted); }
    .no-project { font-size:12px; color:var(--text-secondary); }
    .no-proj-msg { margin-bottom:12px; }

    .badge { font-size:10px; font-weight:500; border-radius:5px; padding:2px 7px; }
    .badge-activo    { background:#EAF3DE; color:#27500A; }
    .badge-pausado   { background:#FAEEDA; color:#633806; }
    .badge-finalizado { background:#F1EFE8; color:#5F5E5A; }

    .modal-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,0.35);
      display:flex; align-items:center; justify-content:center; z-index:200;
    }
    .modal {
      background:var(--bg-card); border-radius:12px; border:1px solid var(--border);
      padding:24px; width:360px; display:flex; flex-direction:column; gap:12px;
    }
    .modal-title  { font-size:15px; font-weight:600; }
    .form-input {
      width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:7px;
      font-size:12px; font-family:inherit; color:var(--text-primary); background:var(--bg-page); outline:none;
    }
    .form-input:focus { border-color:var(--accent); }
    .modal-actions { display:flex; gap:8px; justify-content:flex-end; }
  `]
})
export class GrupoDetalleComponent implements OnInit {
  @Input() id!: number;

  grupo    = signal<Grupo | null>(null);
  proyecto = signal<Proyecto | null>(null);

  esProfesor() { return this.auth.esProfesor(); }
  esEstudiante() { return this.auth.esEstudiante(); }

  mostrarEditar   = false;
  mostrarAgregar  = false;
  mostrarProyecto = false;
  nuevoNombre     = '';
  formIntegrante = { nombre: '', email: '' };
  formProyecto = { titulo: '', descripcion: '' };
  credencialGenerada = signal<CredencialIntegrante | null>(null);

  constructor(
    private auth: AuthService,
    private grupoService: GrupoService,
    private proyectoService: ProyectoService
  ) {}

  ngOnInit() {
    const grupoId = this.id ?? this.auth.usuario()?.grupoId;
    if (!grupoId) return;
    this.grupoService.obtener(grupoId).subscribe(g => {
      this.grupo.set(g);
      this.nuevoNombre = g.nombre;
    });
    this.proyectoService.porGrupo(grupoId).subscribe({
         next: p => this.proyecto.set(p),
      error: () => {}
    });
  }

  editarGrupo() {
    const g = this.grupo();
    if (!g || !this.nuevoNombre) return;
    this.grupoService.editar(g.id, this.nuevoNombre).subscribe(() => {
      this.grupo.update(gr => gr ? { ...gr, nombre: this.nuevoNombre } : gr);
      this.mostrarEditar = false;
    });
  }

  agregarIntegrante() {
    const g = this.grupo();
    if (!g || !this.formIntegrante.nombre.trim()) return;

    this.grupoService.agregarIntegrante(g.id, {
      nombre: this.formIntegrante.nombre.trim(),
      email: this.formIntegrante.email.trim() || undefined
    }).subscribe(res => {
      this.grupoService.obtener(g.id).subscribe(gr => this.grupo.set(gr));
      this.credencialGenerada.set(res);
      this.mostrarAgregar = false;
      this.formIntegrante = { nombre: '', email: '' };
    });
  }

  removerIntegrante(uid: number) {
    const g = this.grupo();
    if (!g) return;
    this.grupoService.removerIntegrante(g.id, uid).subscribe(() => {
      this.grupo.update(gr => gr
        ? { ...gr, integrantes: gr.integrantes.filter(i => i.id !== uid) }
        : gr);
    });
  }

  crearProyecto() {
    const g = this.grupo();
    if (!g || !this.formProyecto.titulo) return;
    this.proyectoService.crear({
      titulo: this.formProyecto.titulo,
      descripcion: this.formProyecto.descripcion,
      grupoId: g.id
    }).subscribe(p => {
      this.proyecto.set(p);
      this.mostrarProyecto = false;
      this.formProyecto = { titulo: '', descripcion: '' };
    });
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
