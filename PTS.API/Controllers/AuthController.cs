using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PTS.API.Data;
using PTS.API.DTOs;
using PTS.API.Models;
using PTS.API.Services;

namespace PTS.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(PtsDbContext db, IJwtService jwtService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { mensaje = "Credenciales inválidas" });
        }

        var token = jwtService.GenerateToken(user);
        return Ok(new AuthResponseDto(token, ToUsuarioDto(user)));
    }

    [HttpPatch("password")]
    [Authorize(Roles = "ESTUDIANTE")]
    public async Task<IActionResult> CambiarPassword(CambiarPasswordDto dto)
    {
        var userId = GetUserId();
        var user = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, user.PasswordHash))
        {
            return BadRequest(new { mensaje = "Contraseña actual incorrecta" });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordNueva);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioDto>> Me()
    {
        var userId = GetUserId();
        var user = await db.Usuarios.FindAsync(userId);
        if (user is null) return NotFound();
        return Ok(ToUsuarioDto(user));
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static UsuarioDto ToUsuarioDto(Usuario u) => new(u.Id, u.Nombre, u.Email, u.Rol, u.GrupoId);
}
