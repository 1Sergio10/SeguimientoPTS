using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PTS.API.Data;
using PTS.API.DTOs;
using PTS.API.Models;

namespace PTS.API.Controllers;

[ApiController]
[Route("api/tareas")]
[Authorize]
public class TareasController(PtsDbContext db) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TareaDto>> Obtener(int id)
    {
        var tarea = await db.Tareas
            .Include(t => t.CreadaPor)
            .Include(t => t.AsignadoA)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tarea is null) return NotFound();
        return Ok(ToDto(tarea));
    }

    [HttpPost]
    [Authorize(Roles = "ESTUDIANTE")]
    public async Task<ActionResult<TareaDto>> Crear(CrearTareaDto dto)
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var tarea = new Tarea
        {
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            SprintId = dto.SprintId,
            Puntos = dto.Puntos,
            Estado = EstadoTarea.BACKLOG,
            CreadaPorId = uid
        };

        db.Tareas.Add(tarea);
        await db.SaveChangesAsync();

        var created = await db.Tareas
            .Include(t => t.CreadaPor)
            .Include(t => t.AsignadoA)
            .FirstAsync(t => t.Id == tarea.Id);

        return Ok(ToDto(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<TareaDto>> Editar(int id, EditarTareaDto dto)
    {
        var tarea = await db.Tareas
            .Include(t => t.CreadaPor)
            .Include(t => t.AsignadoA)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (tarea is null) return NotFound();

        tarea.Titulo = dto.Titulo;
        tarea.Descripcion = dto.Descripcion;
        tarea.Puntos = dto.Puntos;
        tarea.SprintId = dto.SprintId;
        tarea.AsignadoAId = dto.AsignadoAId;

        await db.SaveChangesAsync();
        return Ok(ToDto(tarea));
    }

    [HttpPatch("{id:int}/estado")]
    public async Task<ActionResult<TareaDto>> CambiarEstado(int id, MoverTareaDto dto)
    {
        var tarea = await db.Tareas
            .Include(t => t.CreadaPor)
            .Include(t => t.AsignadoA)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (tarea is null) return NotFound();

        var esProfesor = User.IsInRole("PROFESOR");

        // R2: estudiante no puede mover a COMPLETADO
        if (!esProfesor && dto.Estado == EstadoTarea.COMPLETADO)
        {
            return Forbid();
        }

        // R3: transición estricta para estudiante BACKLOG -> EN_PROGRESO -> EN_REVISION
        if (!esProfesor)
        {
            var valido = (tarea.Estado, dto.Estado) switch
            {
                (EstadoTarea.BACKLOG, EstadoTarea.EN_PROGRESO) => true,
                (EstadoTarea.EN_PROGRESO, EstadoTarea.EN_REVISION) => true,
                _ => false
            };

            if (!valido)
            {
                return BadRequest(new { mensaje = "Transición no permitida para estudiantes" });
            }
        }

        tarea.Estado = dto.Estado;
        await db.SaveChangesAsync();
        return Ok(ToDto(tarea));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var tarea = await db.Tareas.FindAsync(id);
        if (tarea is null) return NotFound();

        db.Tareas.Remove(tarea);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static TareaDto ToDto(Tarea t) => new(
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
