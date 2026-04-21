using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PTS.API.Models;

namespace PTS.API.Services;

public interface IJwtService
{
    string GenerateToken(Usuario usuario);
}

public class JwtService(IConfiguration config) : IJwtService
{
    public string GenerateToken(Usuario usuario)
    {
        var key = config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key no configurado");
        var issuer = config["Jwt:Issuer"] ?? "pts-api";
        var audience = config["Jwt:Audience"] ?? "pts-frontend";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new("Id", usuario.Id.ToString()),
            new("Nombre", usuario.Nombre),
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, usuario.Rol.ToString())
        };

        if (usuario.GrupoId.HasValue)
        {
            claims.Add(new Claim("grupoId", usuario.GrupoId.Value.ToString()));
        }

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
