import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Clase, CrearClaseDto,
  Grupo, CrearGrupoDto,
  AgregarIntegranteGrupoDto, CredencialIntegrante,
  Proyecto, CrearProyectoDto,
  Sprint, CrearSprintDto, EditarSprintDto,
  Tarea, CrearTareaDto, EditarTareaDto, MoverTareaDto,
  DashboardProfesorDto, DashboardEstudianteDto,
  GitHubCommit, GitHubPR, GitHubRepo, VincularEvidenciaDto, VincularRepoDto
} from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ClaseService {
  constructor(private http: HttpClient) {}
  miClase()                  { return this.http.get<Clase>(`${API}/clases/mia`); }
  crear(dto: CrearClaseDto)  { return this.http.post<Clase>(`${API}/clases`, dto); }
}

@Injectable({ providedIn: 'root' })
export class GrupoService {
  constructor(private http: HttpClient) {}
  porClase(claseId: number)              { return this.http.get<Grupo[]>(`${API}/clases/${claseId}/grupos`); }
  obtener(id: number)                    { return this.http.get<Grupo>(`${API}/grupos/${id}`); }
  crear(dto: CrearGrupoDto)              { return this.http.post<Grupo>(`${API}/grupos`, dto); }
  editar(id: number, nombre: string)     { return this.http.put(`${API}/grupos/${id}`, { nombre }); }
  eliminar(id: number)                   { return this.http.delete(`${API}/grupos/${id}`); }
  agregarIntegrante(gid: number, dto: AgregarIntegranteGrupoDto) {
    return this.http.post<CredencialIntegrante>(`${API}/grupos/${gid}/integrantes`, dto);
  }
  removerIntegrante(gid: number, uid: number) {
    return this.http.delete(`${API}/grupos/${gid}/integrantes/${uid}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  constructor(private http: HttpClient) {}
  porGrupo(grupoId: number)            { return this.http.get<Proyecto>(`${API}/grupos/${grupoId}/proyecto`); }
  crear(dto: CrearProyectoDto)         { return this.http.post<Proyecto>(`${API}/proyectos`, dto); }
}

@Injectable({ providedIn: 'root' })
export class SprintService {
  constructor(private http: HttpClient) {}
  porProyecto(proyectoId: number)  { return this.http.get<Sprint[]>(`${API}/proyectos/${proyectoId}/sprints`); }
  obtener(id: number)              { return this.http.get<Sprint>(`${API}/sprints/${id}`); }
  crear(dto: CrearSprintDto)       { return this.http.post<Sprint>(`${API}/sprints`, dto); }
  editar(id: number, dto: EditarSprintDto) { return this.http.put<Sprint>(`${API}/sprints/${id}`, dto); }
  cerrar(id: number)               { return this.http.patch(`${API}/sprints/${id}/cerrar`, {}); }
}

@Injectable({ providedIn: 'root' })
export class TareaService {
  constructor(private http: HttpClient) {}
  porSprint(sprintId: number)              { return this.http.get<Tarea[]>(`${API}/sprints/${sprintId}/tareas`); }
  obtener(id: number)                      { return this.http.get<Tarea>(`${API}/tareas/${id}`); }
  crear(dto: CrearTareaDto)                { return this.http.post<Tarea>(`${API}/tareas`, dto); }
  editar(id: number, dto: EditarTareaDto)  { return this.http.put<Tarea>(`${API}/tareas/${id}`, dto); }
  moverEstado(id: number, dto: MoverTareaDto) {
    return this.http.patch<Tarea>(`${API}/tareas/${id}/estado`, dto);
  }
  eliminar(id: number) { return this.http.delete(`${API}/tareas/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}
  resumenProfesor()   { return this.http.get<DashboardProfesorDto>(`${API}/dashboard/profesor`); }
  resumenEstudiante() { return this.http.get<DashboardEstudianteDto>(`${API}/dashboard/estudiante`); }
}

@Injectable({ providedIn: 'root' })
export class GitHubService {
  constructor(private http: HttpClient) {}

  vincularRepo(dto: VincularRepoDto) {
    return this.http.post<GitHubRepo>(`${API}/github/repos`, dto);
  }

  obtenerRepo(proyectoId: number) {
    return this.http.get<GitHubRepo>(`${API}/github/repos/${proyectoId}`);
  }

  sincronizarRepo(repoId: number) {
    return this.http.post<void>(`${API}/github/repos/${repoId}/sincronizar`, {});
  }

  commits(repoId: number, tareaId?: number) {
    const url = tareaId
      ? `${API}/github/repos/${repoId}/commits?tareaId=${tareaId}`
      : `${API}/github/repos/${repoId}/commits`;
    return this.http.get<GitHubCommit[]>(url);
  }

  prs(repoId: number, tareaId?: number) {
    const url = tareaId
      ? `${API}/github/repos/${repoId}/prs?tareaId=${tareaId}`
      : `${API}/github/repos/${repoId}/prs`;
    return this.http.get<GitHubPR[]>(url);
  }

  vincularCommit(commitId: number, dto: VincularEvidenciaDto) {
    return this.http.patch<void>(`${API}/github/commits/${commitId}/tarea`, dto);
  }

  vincularPr(prId: number, dto: VincularEvidenciaDto) {
    return this.http.patch<void>(`${API}/github/prs/${prId}/tarea`, dto);
  }
}