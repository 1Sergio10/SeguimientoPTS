using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PTS.API.Data;
using PTS.API.DTOs;
using PTS.API.Models;

namespace PTS.API.Controllers;

[ApiController]
[Route("api/clases")]
[Authorize]
public class ClasesController(PtsDbContext db) : ControllerBase
{
    [HttpGet("mia")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<ClaseDto>> MiClase()
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var clase = await db.Clases.FirstOrDefaultAsync(c => c.ProfesorId == uid);
        if (clase is null) return NotFound();
        return Ok(new ClaseDto(clase.Id, clase.Nombre, clase.Codigo, clase.Semestre, clase.ProfesorId));
    }

    [HttpPost]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<ClaseDto>> Crear(CrearClaseDto dto)
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existe = await db.Clases.AnyAsync(c => c.ProfesorId == uid);
        if (existe) return BadRequest(new { mensaje = "Un profesor solo puede tener una clase" });

        var clase = new Clase
        {
            Nombre = dto.Nombre,
            Codigo = dto.Codigo,
            Semestre = dto.Semestre,
            ProfesorId = uid
        };

        db.Clases.Add(clase);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(MiClase), new { id = clase.Id }, new ClaseDto(clase.Id, clase.Nombre, clase.Codigo, clase.Semestre, clase.ProfesorId));
    }

    [HttpGet("{id:int}/grupos")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<List<GrupoDto>>> GruposDeClase(int id)
    {
        var grupos = await db.Grupos
            .Include(g => g.Integrantes)
            .Include(g => g.Proyecto)
            .Where(g => g.ClaseId == id)
            .ToListAsync();

        return Ok(grupos.Select(g => new GrupoDto(
            g.Id,
            g.Nombre,
            g.ClaseId,
            g.Integrantes.Select(u => new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.GrupoId)).ToList(),
            g.Proyecto is null
                ? null
                : new ProyectoResumenDto(g.Proyecto.Id, g.Proyecto.Titulo, g.Proyecto.Estado.ToString(), 0)
        )).ToList());
    }
}

[ApiController]
[Route("api/proyectos")]
[Authorize]
public class ProyectosController(PtsDbContext db) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "ESTUDIANTE")]
    public async Task<ActionResult<ProyectoDto>> Crear(CrearProyectoDto dto)
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Usuarios.FindAsync(uid);
        if (user?.GrupoId != dto.GrupoId) return Forbid();

        var existe = await db.Proyectos.AnyAsync(p => p.GrupoId == dto.GrupoId);
        if (existe) return BadRequest(new { mensaje = "El grupo ya tiene proyecto" });

        var proyecto = new Proyecto
        {
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            GrupoId = dto.GrupoId,
            Estado = EstadoProyecto.ACTIVO
        };

        db.Proyectos.Add(proyecto);
        await db.SaveChangesAsync();
        return Ok(new ProyectoDto(proyecto.Id, proyecto.Titulo, proyecto.Descripcion, proyecto.GrupoId, proyecto.Estado, 0));
    }

    [HttpGet("{id:int}/sprints")]
    public async Task<ActionResult<List<SprintDto>>> Sprints(int id)
    {
        var sprints = await db.Sprints
            .Where(s => s.ProyectoId == id)
            .Include(s => s.Tareas)
            .OrderBy(s => s.Numero)
            .ToListAsync();

        return Ok(sprints.Select(ToSprintDto).ToList());
    }

    private static SprintDto ToSprintDto(Sprint s) => new(
        s.Id,
        s.Numero,
        s.ProyectoId,
        s.Meta,
        s.FechaInicio,
        s.FechaFin,
        s.Cerrado,
        s.Tareas.Count,
        s.Tareas.Count(t => t.Estado == EstadoTarea.COMPLETADO)
    );
}

[ApiController]
[Route("api/sprints")]
[Authorize]
public class SprintsController(PtsDbContext db) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SprintDto>> Obtener(int id)
    {
        var sprint = await db.Sprints.Include(s => s.Tareas).FirstOrDefaultAsync(s => s.Id == id);
        if (sprint is null) return NotFound();
        return Ok(ToSprintDto(sprint));
    }

    [HttpPost]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<SprintDto>> Crear(CrearSprintDto dto)
    {
        var sprint = new Sprint
        {
            Numero = dto.Numero,
            ProyectoId = dto.ProyectoId,
            Meta = dto.Meta,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Cerrado = false
        };

        db.Sprints.Add(sprint);
        await db.SaveChangesAsync();
        return Ok(ToSprintDto(sprint));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<SprintDto>> Editar(int id, EditarSprintDto dto)
    {
        var sprint = await db.Sprints.Include(s => s.Tareas).FirstOrDefaultAsync(s => s.Id == id);
        if (sprint is null) return NotFound();

        sprint.Numero = dto.Numero;
        sprint.Meta = dto.Meta;
        sprint.FechaInicio = dto.FechaInicio;
        sprint.FechaFin = dto.FechaFin;

        await db.SaveChangesAsync();
        return Ok(ToSprintDto(sprint));
    }

    [HttpPatch("{id:int}/cerrar")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<IActionResult> Cerrar(int id)
    {
        var sprint = await db.Sprints.FindAsync(id);
        if (sprint is null) return NotFound();

        sprint.Cerrado = true;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/tareas")]
    public async Task<ActionResult<List<TareaDto>>> Tareas(int id)
    {
        var tareas = await db.Tareas
            .Include(t => t.CreadaPor)
            .Include(t => t.AsignadoA)
            .Where(t => t.SprintId == id)
            .ToListAsync();

        return Ok(tareas.Select(ToTareaDto).ToList());
    }

    private static SprintDto ToSprintDto(Sprint s) => new(
        s.Id,
        s.Numero,
        s.ProyectoId,
        s.Meta,
        s.FechaInicio,
        s.FechaFin,
        s.Cerrado,
        s.Tareas.Count,
        s.Tareas.Count(t => t.Estado == EstadoTarea.COMPLETADO)
    );

    private static TareaDto ToTareaDto(Tarea t) => new(
        t.Id,
        t.Titulo,
        t.Descripcion,
        t.SprintId,
        new UsuarioDto(t.CreadaPor.Id, t.CreadaPor.Nombre, t.CreadaPor.Email, t.CreadaPor.Rol, t.CreadaPor.GrupoId),
        t.AsignadoA is null ? null : new UsuarioDto(t.AsignadoA.Id, t.AsignadoA.Nombre, t.AsignadoA.Email, t.AsignadoA.Rol, t.AsignadoA.GrupoId),
        t.Estado,
        t.Puntos
    );
}

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(PtsDbContext db) : ControllerBase
{
    [HttpGet("profesor")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<DashboardProfesorDto>> Profesor()
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var clase = await db.Clases.FirstOrDefaultAsync(c => c.ProfesorId == uid);
        if (clase is null) return NotFound();

        var grupos = await db.Grupos
            .Where(g => g.ClaseId == clase.Id)
            .Include(g => g.Proyecto)
            .ThenInclude(p => p!.Sprints)
            .ThenInclude(s => s.Tareas)
            .ToListAsync();

        var resumenes = grupos.Select(g =>
        {
            var proyecto = g.Proyecto;
            if (proyecto is null)
            {
                return new ResumenGrupoDto(g.Id, g.Nombre, "Sin proyecto", 0, 0, 0, 0, "EN_RIESGO");
            }

            var sprints = proyecto.Sprints.OrderBy(s => s.Numero).ToList();
            var sprintActual = sprints.LastOrDefault()?.Numero ?? 0;
            var tareas = sprints.SelectMany(s => s.Tareas).ToList();
            var total = tareas.Count;
            var completadas = tareas.Count(t => t.Estado == EstadoTarea.COMPLETADO);
            var avance = total == 0 ? 0 : (int)Math.Round(completadas * 100.0 / total);
            var estado = avance >= 70 ? "AL_DIA" : avance >= 40 ? "EN_RIESGO" : "RETRASADO";

            return new ResumenGrupoDto(g.Id, g.Nombre, proyecto.Titulo, sprintActual, total, completadas, avance, estado);
        }).ToList();

        var tareasRevision = await db.Tareas.CountAsync(t => t.Estado == EstadoTarea.EN_REVISION);
        var avanceGeneral = resumenes.Count == 0 ? 0 : (int)Math.Round(resumenes.Average(r => r.AvancePorcentaje));

        return Ok(new DashboardProfesorDto(
            new ClaseDto(clase.Id, clase.Nombre, clase.Codigo, clase.Semestre, clase.ProfesorId),
            grupos.Count,
            tareasRevision,
            avanceGeneral,
            resumenes
        ));
    }

    [HttpGet("estudiante")]
    [Authorize(Roles = "ESTUDIANTE")]
    public async Task<ActionResult<DashboardEstudianteDto>> Estudiante()
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == uid);
        if (user?.GrupoId is null) return NotFound();

        var grupo = await db.Grupos.Include(g => g.Integrantes).FirstAsync(g => g.Id == user.GrupoId.Value);
        var proyecto = await db.Proyectos.Include(p => p.Sprints).ThenInclude(s => s.Tareas).FirstOrDefaultAsync(p => p.GrupoId == grupo.Id);
        if (proyecto is null) return NotFound();

        var sprintActual = proyecto.Sprints.OrderBy(s => s.Numero).LastOrDefault();
        var tareas = proyecto.Sprints.SelectMany(s => s.Tareas).ToList();
        var activas = tareas.Count(t => t.Estado is EstadoTarea.BACKLOG or EstadoTarea.EN_PROGRESO or EstadoTarea.EN_REVISION);
        var completadas = tareas.Count(t => t.Estado == EstadoTarea.COMPLETADO);
        var avance = tareas.Count == 0 ? 0 : (int)Math.Round(completadas * 100.0 / tareas.Count);

        return Ok(new DashboardEstudianteDto(
            new GrupoDto(
                grupo.Id,
                grupo.Nombre,
                grupo.ClaseId,
                grupo.Integrantes.Select(u => new UsuarioDto(u.Id, u.Nombre, u.Email, u.Rol, u.GrupoId)).ToList(),
                new ProyectoResumenDto(proyecto.Id, proyecto.Titulo, proyecto.Estado.ToString(), avance)
            ),
            new ProyectoDto(proyecto.Id, proyecto.Titulo, proyecto.Descripcion, proyecto.GrupoId, proyecto.Estado, avance),
            sprintActual is null ? null : new SprintDto(
                sprintActual.Id,
                sprintActual.Numero,
                sprintActual.ProyectoId,
                sprintActual.Meta,
                sprintActual.FechaInicio,
                sprintActual.FechaFin,
                sprintActual.Cerrado,
                sprintActual.Tareas.Count,
                sprintActual.Tareas.Count(t => t.Estado == EstadoTarea.COMPLETADO)
            ),
            activas,
            completadas,
            avance
        ));
    }
}
