using PTS.API.Models;

namespace PTS.API.DTOs;

public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, UsuarioDto Usuario);
public record CambiarPasswordDto(string PasswordActual, string PasswordNueva);

public record UsuarioDto(int Id, string Nombre, string Email, Rol Rol, int? GrupoId);

public record CrearClaseDto(string Nombre, string Codigo, string Semestre);
public record ClaseDto(int Id, string Nombre, string Codigo, string Semestre, int ProfesorId);

public record CrearGrupoDto(string Nombre, int ClaseId);
public record EditarGrupoDto(string Nombre);
public record AgregarIntegranteGrupoDto(string Nombre, string? Email);
public record CredencialIntegranteDto(int UsuarioId, string Nombre, string Email, string? PasswordTemporal, bool UsuarioCreado);
public record GrupoDto(int Id, string Nombre, int ClaseId, List<UsuarioDto> Integrantes, ProyectoResumenDto? Proyecto);

public record CrearProyectoDto(string Titulo, string Descripcion, int GrupoId);
public record ProyectoDto(int Id, string Titulo, string Descripcion, int GrupoId, EstadoProyecto Estado, int AvancePorcentaje);
public record ProyectoResumenDto(int Id, string Titulo, string Estado, int AvancePorcentaje);

public record CrearSprintDto(int Numero, int ProyectoId, string Meta, DateOnly FechaInicio, DateOnly FechaFin);
public record EditarSprintDto(int Numero, string Meta, DateOnly FechaInicio, DateOnly FechaFin);
public record SprintDto(int Id, int Numero, int ProyectoId, string Meta, DateOnly FechaInicio, DateOnly FechaFin, bool Cerrado, int TareasTotal, int TareasCompletadas);

public record CrearTareaDto(string Titulo, string Descripcion, int SprintId, int Puntos);
public record EditarTareaDto(string Titulo, string Descripcion, int SprintId, int Puntos, int? AsignadoAId);
public record MoverTareaDto(EstadoTarea Estado);
public record TareaDto(int Id, string Titulo, string Descripcion, int SprintId, UsuarioDto CreadaPor, UsuarioDto? AsignadoA, EstadoTarea Estado, int Puntos);

public record DashboardProfesorDto(ClaseDto Clase, int TotalGrupos, int TareasEnRevision, int AvanceGeneral, List<ResumenGrupoDto> Grupos);
public record ResumenGrupoDto(int GrupoId, string NombreGrupo, string NombreProyecto, int SprintActual, int TareasTotal, int TareasCompletadas, int AvancePorcentaje, string Estado);
public record DashboardEstudianteDto(GrupoDto Grupo, ProyectoDto Proyecto, SprintDto? SprintActual, int TareasActivas, int TareasCompletadas, int AvancePorcentaje);

public record VincularRepoDto(string RepoFullName, int ProyectoId);
public record GitHubRepoDto(int Id, string RepoFullName, int ProyectoId, int VinculadoPorId, DateTime? UltimaSincronizacion);
public record GitHubCommitDto(int Id, string Sha, string Mensaje, string AutorGitHub, string Url, DateTime FechaCommit, int RepoId, int? TareaId);
public record GitHubPrDto(int Id, int NumeroPR, string Titulo, string AutorGitHub, string Url, string Estado, DateTime FechaCreacion, DateTime? FechaCierre, int RepoId, int? TareaId);
public record VincularEvidenciaDto(int? TareaId);
