using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PTS.API.Data;
using PTS.API.DTOs;
using PTS.API.Models;

namespace PTS.API.Controllers;

[ApiController]
[Route("api/grupos")]
[Authorize]
public class GruposController(PtsDbContext db) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GrupoDto>> Obtener(int id)
    {
        if (!await PuedeAccederAGrupo(id)) return Forbid();

        var grupo = await db.Grupos
            .Include(g => g.Integrantes)
            .Include(g => g.Proyecto)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (grupo is null) return NotFound();

        return Ok(ToGrupoDto(grupo));
    }

    [HttpPost]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<GrupoDto>> Crear(CrearGrupoDto dto)
    {
        var grupo = new Grupo { Nombre = dto.Nombre, ClaseId = dto.ClaseId };
        db.Grupos.Add(grupo);
        await db.SaveChangesAsync();

        var created = await db.Grupos.Include(g => g.Integrantes).Include(g => g.Proyecto).FirstAsync(g => g.Id == grupo.Id);
        return CreatedAtAction(nameof(Obtener), new { id = grupo.Id }, ToGrupoDto(created));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<IActionResult> Editar(int id, EditarGrupoDto dto)
    {
        var grupo = await db.Grupos.FindAsync(id);
        if (grupo is null) return NotFound();
        grupo.Nombre = dto.Nombre;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/integrantes/{uid:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<IActionResult> AgregarIntegrante(int id, int uid)
    {
        var grupo = await db.Grupos.FindAsync(id);
        var user = await db.Usuarios.FindAsync(uid);
        if (grupo is null || user is null) return NotFound();
        if (user.Rol != Rol.ESTUDIANTE) return BadRequest(new { mensaje = "Solo estudiantes pueden estar en grupos" });

        user.GrupoId = id;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/integrantes")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<ActionResult<CredencialIntegranteDto>> AgregarIntegrantePorDatos(int id, AgregarIntegranteGrupoDto dto)
    {
        var grupo = await db.Grupos.FindAsync(id);
        if (grupo is null) return NotFound();

        var nombre = dto.Nombre?.Trim();
        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { mensaje = "El nombre del estudiante es obligatorio" });

        var email = string.IsNullOrWhiteSpace(dto.Email)
            ? await GenerarEmailGrupo(nombre, id)
            : dto.Email.Trim().ToLowerInvariant();

        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

        if (user is not null)
        {
            if (user.Rol != Rol.ESTUDIANTE)
                return BadRequest(new { mensaje = "Solo estudiantes pueden estar en grupos" });

            if (user.GrupoId.HasValue && user.GrupoId.Value != id)
                return BadRequest(new { mensaje = "El estudiante ya pertenece a otro grupo" });

            user.GrupoId = id;
            await db.SaveChangesAsync();

            return Ok(new CredencialIntegranteDto(user.Id, user.Nombre, user.Email, null, false));
        }

        var passwordTemporal = GenerarPasswordTemporal();
        var nuevo = new Usuario
        {
            Nombre = nombre,
            Email = email,
            Rol = Rol.ESTUDIANTE,
            GrupoId = id,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordTemporal)
        };

        db.Usuarios.Add(nuevo);
        await db.SaveChangesAsync();

        return Ok(new CredencialIntegranteDto(nuevo.Id, nuevo.Nombre, nuevo.Email, passwordTemporal, true));
    }

    [HttpDelete("{id:int}/integrantes/{uid:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<IActionResult> RemoverIntegrante(int id, int uid)
    {
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == uid && u.GrupoId == id);
        if (user is null) return NotFound();

        user.GrupoId = null;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "PROFESOR")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var grupo = await db.Grupos.FindAsync(id);
        if (grupo is null) return NotFound();

        db.Grupos.Remove(grupo);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/proyecto")]
    public async Task<ActionResult<ProyectoDto>> ProyectoPorGrupo(int id)
    {
        if (!await PuedeAccederAGrupo(id)) return Forbid();

        var proyecto = await db.Proyectos
            .Include(p => p.Sprints)
            .ThenInclude(s => s.Tareas)
            .FirstOrDefaultAsync(p => p.GrupoId == id);

        if (proyecto is null) return NotFound();
        return Ok(ToProyectoDto(proyecto));
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool EsProfesor => User.IsInRole("PROFESOR");

    private async Task<bool> PuedeAccederAGrupo(int grupoId)
    {
        if (EsProfesor) return true;

        var user = await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == UserId);
        return user?.GrupoId == grupoId;
    }

    private static GrupoDto ToGrupoDto(Grupo g) => new(
        g.Id,
        g.Nombre,
        g.ClaseId,
        g.Integrantes.Select(ToUsuarioDto).ToList(),
        g.Proyecto is null
            ? null
            : new ProyectoResumenDto(g.Proyecto.Id, g.Proyecto.Titulo, g.Proyecto.Estado.ToString(), CalcularAvance(g.Proyecto))
    );

    private static ProyectoDto ToProyectoDto(Proyecto p) => new(
        p.Id,
        p.Titulo,
        p.Descripcion,
        p.GrupoId,
        p.Estado,
        CalcularAvance(p)
    );

    private static UsuarioDto ToUsuarioDto(Usuario u) => new(u.Id, u.Nombre, u.Email, u.Rol, u.GrupoId);

    private async Task<string> GenerarEmailGrupo(string nombre, int grupoId)
    {
        var baseName = SlugNombre(nombre);
        var candidate = $"{baseName}.g{grupoId}@pts.local";
        var i = 1;

        while (await db.Usuarios.AnyAsync(u => u.Email == candidate))
        {
            candidate = $"{baseName}.g{grupoId}.{i}@pts.local";
            i++;
        }

        return candidate;
    }

    private static string SlugNombre(string value)
    {
        var sb = new StringBuilder();
        foreach (var c in value.ToLowerInvariant().Trim())
        {
            if (char.IsLetterOrDigit(c)) sb.Append(c);
            else if (char.IsWhiteSpace(c) || c == '.' || c == '-' || c == '_') sb.Append('.');
        }

        var slug = sb.ToString().Trim('.');
        while (slug.Contains("..")) slug = slug.Replace("..", ".");
        return string.IsNullOrWhiteSpace(slug) ? "estudiante" : slug;
    }

    private static string GenerarPasswordTemporal()
    {
        var random = Random.Shared.Next(100000, 999999);
        return $"Pts-{random}";
    }

    private static int CalcularAvance(Proyecto p)
    {
        var tareas = p.Sprints.SelectMany(s => s.Tareas).ToList();
        if (tareas.Count == 0) return 0;
        var completadas = tareas.Count(t => t.Estado == EstadoTarea.COMPLETADO);
        return (int)Math.Round(completadas * 100.0 / tareas.Count);
    }
}
