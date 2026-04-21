// ── Enums ──────────────────────────────────────────────────────────────────────
export type Rol = 'PROFESOR' | 'ESTUDIANTE';
export type EstadoTarea = 'BACKLOG' | 'EN_PROGRESO' | 'EN_REVISION' | 'COMPLETADO';
export type EstadoProyecto = 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';

// Transiciones válidas para el estudiante (R3)
export const TRANSICIONES_ESTUDIANTE: Record<EstadoTarea, EstadoTarea | null> = {
  BACKLOG:     'EN_PROGRESO',
  EN_PROGRESO: 'EN_REVISION',
  EN_REVISION: null,
  COMPLETADO:  null,
};

// ── Entidades ──────────────────────────────────────────────────────────────────
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  grupoId?: number;
}

export interface Clase {
  id: number;
  nombre: string;
  codigo: string;
  semestre: string;
  profesorId: number;
  totalGrupos: number;
  creadoEn: string;
}

export interface Grupo {
  id: number;
  nombre: string;
  claseId: number;
  proyecto?: ProyectoResumen;
  integrantes: Usuario[];
  creadoEn: string;
}

export interface ProyectoResumen {
  id: number;
  titulo: string;
  estado: string;
  avancePorcentaje: number;
}

export interface Proyecto {
  id: number;
  titulo: string;
  descripcion: string;
  grupoId: number;
  estado: EstadoProyecto;
  avancePorcentaje: number;
  creadoEn: string;
}

export interface Sprint {
  id: number;
  numero: number;
  proyectoId: number;
  meta: string;
  fechaInicio: string;
  fechaFin: string;
  cerrado: boolean;
  tareasTotal: number;
  tareasCompletadas: number;
  creadoEn: string;
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  sprintId: number;
  creadaPor: Usuario;
  asignadoA?: Usuario;
  estado: EstadoTarea;
  puntos: number;
  creadoEn: string;
  actualizadoEn: string;
}

// ── DTOs Auth ──────────────────────────────────────────────────────────────────
export interface LoginDto      { email: string; password: string; }
export interface AuthResponse  { token: string; usuario: Usuario; }

// ── DTOs Crear ─────────────────────────────────────────────────────────────────
export interface CrearClaseDto    { nombre: string; codigo: string; semestre: string; }
export interface CrearGrupoDto    { nombre: string; claseId: number; }
export interface AgregarIntegranteGrupoDto { nombre: string; email?: string; }
export interface CredencialIntegrante {
  usuarioId: number;
  nombre: string;
  email: string;
  passwordTemporal?: string | null;
  usuarioCreado: boolean;
}
export interface CrearProyectoDto { titulo: string; descripcion: string; grupoId: number; }
export interface CrearSprintDto   { numero: number; proyectoId: number; meta: string; fechaInicio: string; fechaFin: string; }
export interface EditarSprintDto  { numero: number; meta: string; fechaInicio: string; fechaFin: string; }
export interface CrearTareaDto    { titulo: string; descripcion: string; sprintId: number; puntos: number; }
export interface EditarTareaDto   { titulo: string; descripcion: string; puntos: number; sprintId: number; asignadoAId?: number; }
export interface MoverTareaDto    { estado: EstadoTarea; }

// ── DTOs alias para compatibilidad ────────────────────────────────────────────
export type GrupoDto    = Grupo;
export type ProyectoDto = Proyecto;
export type SprintDto   = Sprint;
export type TareaDto    = Tarea;
export type UsuarioDto  = Usuario;
export type ClaseDto    = Clase;
export type ProyectoResumenDto = ProyectoResumen;

// ── Dashboard ──────────────────────────────────────────────────────────────────
export interface ResumenGrupoDto {
  grupoId: number;
  nombreGrupo: string;
  nombreProyecto: string;
  sprintActual: number;
  tareasTotal: number;
  tareasCompletadas: number;
  avancePorcentaje: number;
  estado: 'AL_DIA' | 'EN_RIESGO' | 'RETRASADO';
}

export interface DashboardProfesorDto {
  clase: Clase;
  totalGrupos: number;
  tareasEnRevision: number;
  avanceGeneral: number;
  grupos: ResumenGrupoDto[];
}

export interface DashboardEstudianteDto {
  grupo: Grupo;
  proyecto: Proyecto;
  sprintActual?: Sprint;
  tareasActivas: number;
  tareasCompletadas: number;
  avancePorcentaje: number;
}

// ── GitHub evidencias ─────────────────────────────────────────────────────────
export interface GitHubRepo {
  id: number;
  repoFullName: string;
  proyectoId: number;
  vinculadoPorId: number;
  ultimaSincronizacion?: string;
}

export interface GitHubCommit {
  id: number;
  sha: string;
  mensaje: string;
  autorGitHub: string;
  url: string;
  fechaCommit: string;
  repoId: number;
  tareaId?: number;
}

export interface GitHubPR {
  id: number;
  numeroPR: number;
  titulo: string;
  autorGitHub: string;
  url: string;
  estado: 'open' | 'closed' | 'merged';
  fechaCreacion: string;
  fechaCierre?: string;
  repoId: number;
  tareaId?: number;
}

export interface VincularRepoDto {
  repoFullName: string;
  proyectoId: number;
}

export interface VincularEvidenciaDto {
  tareaId: number | null;
}