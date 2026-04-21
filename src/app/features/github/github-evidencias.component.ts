import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ClaseService, GitHubService, GrupoService, ProyectoService } from '../../core/services/api.services';
import { GitHubCommit, GitHubPR, GitHubRepo, Grupo } from '../../core/models';

@Component({
  selector: 'pts-github-evidencias',
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Evidencias GitHub</h2>
          <div class="page-sub">Commits y pull requests vinculados al proyecto</div>
        </div>
        @if (repo()) {
          <button class="btn" (click)="sincronizar()" [disabled]="cargando()">Sincronizar</button>
        }
      </div>

      @if (esProfesor() && grupos().length > 0) {
        <div class="card" style="margin-bottom:14px">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Grupo</label>
              <select class="form-input" [(ngModel)]="grupoSeleccionadoId" (change)="cambiarGrupo()">
                @for (g of grupos(); track g.id) {
                  <option [value]="g.id">{{ g.nombre }}</option>
                }
              </select>
            </div>
          </div>
        </div>
      }

      @if (!repo()) {
        <div class="card">
          <div class="card-title">Vincular repositorio</div>
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Repositorio (owner/repo)</label>
              <input class="form-input" [(ngModel)]="repoFullName" placeholder="org/proyecto-pts" />
            </div>
            <button class="btn btn-primary" (click)="vincularRepo()" [disabled]="!puedeVincular()">
              Vincular
            </button>
          </div>
        </div>
      } @else {
        <div class="card" style="margin-bottom:14px">
          <div class="repo-row">
            <div>
              <div class="repo-name">{{ repo()!.repoFullName }}</div>
              <div class="repo-sub">
                Última sincronización:
                {{ repo()!.ultimaSincronizacion ? (repo()!.ultimaSincronizacion! | date:'d MMM yyyy, HH:mm') : 'nunca' }}
              </div>
            </div>
          </div>
        </div>

        <div class="grid-two">
          <div class="card">
            <div class="card-title">Commits recientes</div>
            @if (commits().length === 0) {
              <div class="empty">No hay commits sincronizados.</div>
            }
            @for (c of commits(); track c.id) {
              <div class="ev-row">
                <div class="ev-main">
                  <a class="ev-link" [href]="c.url" target="_blank" rel="noopener">{{ c.mensaje }}</a>
                  <div class="ev-sub">{{ c.sha.slice(0, 7) }} · {{ c.autorGitHub }} · {{ c.fechaCommit | date:'d MMM, HH:mm' }}</div>
                </div>
                @if (esEstudiante()) {
                  <div class="ev-actions">
                    <input class="input-task" type="number" [(ngModel)]="commitTaskMap[c.id]" placeholder="Tarea #" />
                    <button class="btn btn-sm" (click)="vincularCommit(c.id)">Vincular</button>
                  </div>
                } @else {
                  <span class="tag">Tarea: {{ c.tareaId ?? '—' }}</span>
                }
              </div>
            }
          </div>

          <div class="card">
            <div class="card-title">Pull requests recientes</div>
            @if (prs().length === 0) {
              <div class="empty">No hay pull requests sincronizados.</div>
            }
            @for (p of prs(); track p.id) {
              <div class="ev-row">
                <div class="ev-main">
                  <a class="ev-link" [href]="p.url" target="_blank" rel="noopener">#{{ p.numeroPR }} · {{ p.titulo }}</a>
                  <div class="ev-sub">{{ p.autorGitHub }} · {{ p.estado }} · {{ p.fechaCreacion | date:'d MMM, HH:mm' }}</div>
                </div>
                @if (esEstudiante()) {
                  <div class="ev-actions">
                    <input class="input-task" type="number" [(ngModel)]="prTaskMap[p.id]" placeholder="Tarea #" />
                    <button class="btn btn-sm" (click)="vincularPr(p.id)">Vincular</button>
                  </div>
                } @else {
                  <span class="tag">Tarea: {{ p.tareaId ?? '—' }}</span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
    .grid-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .repo-row { display: flex; align-items: center; justify-content: space-between; }
    .repo-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .repo-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
    .form-row { display: flex; align-items: end; gap: 8px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 11px; color: var(--text-secondary); }
    .form-input {
      width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 7px;
      font-size: 12px; font-family: inherit; color: var(--text-primary); background: var(--bg-page); outline: none;
    }
    .form-input:focus { border-color: var(--accent); }
    .ev-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .ev-row:last-child { border-bottom: none; }
    .ev-main { min-width: 0; flex: 1; }
    .ev-link { color: var(--text-primary); text-decoration: none; font-size: 12px; font-weight: 500; }
    .ev-link:hover { color: var(--accent); }
    .ev-sub { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
    .ev-actions { display: flex; align-items: center; gap: 6px; }
    .input-task {
      width: 78px; padding: 5px 8px; border: 1px solid var(--border); border-radius: 6px;
      font-size: 11px; font-family: inherit; color: var(--text-primary); background: var(--bg-page); outline: none;
    }
    .tag { font-size: 10px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: 5px; padding: 2px 7px; }
    .empty { font-size: 12px; color: var(--text-secondary); padding: 6px 0; }
    .btn-sm { font-size: 11px; padding: 5px 10px; }

    @media (max-width: 900px) {
      .grid-two { grid-template-columns: 1fr; }
      .ev-row { align-items: start; flex-direction: column; }
      .ev-actions { width: 100%; }
    }
  `]
})
export class GithubEvidenciasComponent implements OnInit {
  esProfesor() { return this.auth.esProfesor(); }
  esEstudiante() { return this.auth.esEstudiante(); }

  readonly cargando = signal(false);
  readonly grupos = signal<Grupo[]>([]);
  readonly repo = signal<GitHubRepo | null>(null);
  readonly commits = signal<GitHubCommit[]>([]);
  readonly prs = signal<GitHubPR[]>([]);

  grupoSeleccionadoId = 0;
  proyectoId: number | null = null;
  repoFullName = '';
  commitTaskMap: Record<number, number | null> = {};
  prTaskMap: Record<number, number | null> = {};

  constructor(
    private auth: AuthService,
    private claseService: ClaseService,
    private grupoService: GrupoService,
    private proyectoService: ProyectoService,
    private githubService: GitHubService
  ) {}

  ngOnInit() {
    if (this.esEstudiante()) {
      const grupoId = this.auth.usuario()?.grupoId;
      if (!grupoId) return;
      this.cargarProyectoPorGrupo(grupoId);
      return;
    }

    this.claseService.miClase().subscribe({
      next: clase => {
        this.grupoService.porClase(clase.id).subscribe(gs => {
          this.grupos.set(gs);
          if (gs.length > 0) {
            this.grupoSeleccionadoId = gs[0].id;
            this.cambiarGrupo();
          }
        });
      }
    });
  }

  cambiarGrupo() {
    if (!this.grupoSeleccionadoId) return;
    this.cargarProyectoPorGrupo(Number(this.grupoSeleccionadoId));
  }

  cargarProyectoPorGrupo(grupoId: number) {
    this.proyectoService.porGrupo(grupoId).subscribe({
      next: proyecto => {
        this.proyectoId = proyecto.id;
        this.cargarRepo();
      },
      error: () => {
        this.proyectoId = null;
        this.repo.set(null);
        this.commits.set([]);
        this.prs.set([]);
      }
    });
  }

  puedeVincular() {
    return this.repoFullName.trim().length > 0 && this.proyectoId !== null;
  }

  vincularRepo() {
    if (!this.proyectoId || !this.repoFullName.trim()) return;
    this.githubService.vincularRepo({
      repoFullName: this.repoFullName.trim(),
      proyectoId: this.proyectoId
    }).subscribe(repo => {
      this.repo.set(repo);
      this.repoFullName = '';
      this.recargarEvidencias();
    });
  }

  sincronizar() {
    const repo = this.repo();
    if (!repo) return;
    this.cargando.set(true);
    this.githubService.sincronizarRepo(repo.id).subscribe({
      next: () => this.recargarEvidencias(),
      error: () => this.cargando.set(false),
      complete: () => this.cargando.set(false)
    });
  }

  vincularCommit(commitId: number) {
    this.githubService.vincularCommit(commitId, { tareaId: this.commitTaskMap[commitId] ?? null }).subscribe(() => {
      this.recargarEvidencias();
    });
  }

  vincularPr(prId: number) {
    this.githubService.vincularPr(prId, { tareaId: this.prTaskMap[prId] ?? null }).subscribe(() => {
      this.recargarEvidencias();
    });
  }

  private cargarRepo() {
    if (!this.proyectoId) return;
    this.githubService.obtenerRepo(this.proyectoId).subscribe({
      next: repo => {
        this.repo.set(repo);
        this.recargarEvidencias();
      },
      error: () => {
        this.repo.set(null);
        this.commits.set([]);
        this.prs.set([]);
      }
    });
  }

  private recargarEvidencias() {
    const repo = this.repo();
    if (!repo) return;
    this.githubService.commits(repo.id).subscribe(cs => this.commits.set(cs));
    this.githubService.prs(repo.id).subscribe(ps => this.prs.set(ps));
  }
}
