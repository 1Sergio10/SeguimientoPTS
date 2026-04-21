namespace PTS.API.Models;

public enum Rol { PROFESOR, ESTUDIANTE }
public enum EstadoTarea { BACKLOG, EN_PROGRESO, EN_REVISION, COMPLETADO }
public enum EstadoProyecto { ACTIVO, PAUSADO, FINALIZADO }

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Rol Rol { get; set; }
    public int? GrupoId { get; set; }

    public Grupo? Grupo { get; set; }
    public ICollection<Tarea> TareasCreadas { get; set; } = [];
    public ICollection<Tarea> TareasAsignadas { get; set; } = [];
}

public class Clase
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Semestre { get; set; } = string.Empty;
    public int ProfesorId { get; set; }

    public Usuario Profesor { get; set; } = null!;
    public ICollection<Grupo> Grupos { get; set; } = [];
}

public class Grupo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int ClaseId { get; set; }

    public Clase Clase { get; set; } = null!;
    public ICollection<Usuario> Integrantes { get; set; } = [];
    public Proyecto? Proyecto { get; set; }
}

public class Proyecto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int GrupoId { get; set; }
    public EstadoProyecto Estado { get; set; } = EstadoProyecto.ACTIVO;

    public Grupo Grupo { get; set; } = null!;
    public ICollection<Sprint> Sprints { get; set; } = [];
}

public class Sprint
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public int ProyectoId { get; set; }
    public string Meta { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public bool Cerrado { get; set; }

    public Proyecto Proyecto { get; set; } = null!;
    public ICollection<Tarea> Tareas { get; set; } = [];
}

public class Tarea
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int SprintId { get; set; }
    public int CreadaPorId { get; set; }
    public int? AsignadoAId { get; set; }
    public EstadoTarea Estado { get; set; } = EstadoTarea.BACKLOG;
    public int Puntos { get; set; }

    public Sprint Sprint { get; set; } = null!;
    public Usuario CreadaPor { get; set; } = null!;
    public Usuario? AsignadoA { get; set; }
}
