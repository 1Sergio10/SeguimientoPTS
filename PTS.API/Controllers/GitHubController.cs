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
[Route("api/github")]
[Authorize]
public class GitHubController(PtsDbContext db, IGitHubService gitHubService) : ControllerBase
{
    [HttpPost("repos")]
    public async Task<ActionResult<GitHubRepoDto>> VincularRepo(VincularRepoDto dto)
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var existe = await db.GitHubRepos.FirstOrDefaultAsync(r => r.ProyectoId == dto.ProyectoId);
        if (existe is not null) return Conflict(new { mensaje = "Ya existe un repo vinculado para este proyecto" });

        var repo = new GitHubRepo
        {
            RepoFullName = dto.RepoFullName,
            ProyectoId = dto.ProyectoId,
            VinculadoPorId = uid
        };

        db.GitHubRepos.Add(repo);
        await db.SaveChangesAsync();
        return Ok(ToRepoDto(repo));
    }

    [HttpGet("repos/{proyectoId:int}")]
    public async Task<ActionResult<GitHubRepoDto>> ObtenerRepo(int proyectoId)
    {
        var repo = await db.GitHubRepos.FirstOrDefaultAsync(r => r.ProyectoId == proyectoId);
        if (repo is null) return NotFound();
        return Ok(ToRepoDto(repo));
    }

    [HttpPost("repos/{id:int}/sincronizar")]
    public async Task<IActionResult> Sincronizar(int id, CancellationToken ct)
    {
        var repo = await db.GitHubRepos.FindAsync([id], ct);
        if (repo is null) return NotFound();

        var commits = await gitHubService.ObtenerCommitsAsync(repo.RepoFullName, ct);
        foreach (var c in commits)
        {
            var existe = await db.GitHubCommits.AnyAsync(x => x.RepoId == repo.Id && x.Sha == c.Sha, ct);
            if (existe) continue;

            db.GitHubCommits.Add(new GitHubCommit
            {
                RepoId = repo.Id,
                Sha = c.Sha,
                Mensaje = c.Mensaje,
                AutorGitHub = c.Autor,
                Url = c.Url,
                FechaCommit = c.FechaCommit
            });
        }

        var prs = await gitHubService.ObtenerPrsAsync(repo.RepoFullName, ct);
        foreach (var p in prs)
        {
            var existe = await db.GitHubPRs.AnyAsync(x => x.RepoId == repo.Id && x.NumeroPR == p.Numero, ct);
            if (existe) continue;

            db.GitHubPRs.Add(new GitHubPR
            {
                RepoId = repo.Id,
                NumeroPR = p.Numero,
                Titulo = p.Titulo,
                AutorGitHub = p.Autor,
                Url = p.Url,
                Estado = p.Estado,
                FechaCreacion = p.FechaCreacion,
                FechaCierre = p.FechaCierre
            });
        }

        repo.UltimaSincronizacion = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("repos/{id:int}/commits")]
    public async Task<ActionResult<List<GitHubCommitDto>>> Commits(int id, [FromQuery] int? tareaId)
    {
        var query = db.GitHubCommits.Where(c => c.RepoId == id);
        if (tareaId.HasValue) query = query.Where(c => c.TareaId == tareaId);

        var commits = await query.OrderByDescending(c => c.FechaCommit).ToListAsync();
        return Ok(commits.Select(ToCommitDto).ToList());
    }

    [HttpGet("repos/{id:int}/prs")]
    public async Task<ActionResult<List<GitHubPrDto>>> Prs(int id, [FromQuery] int? tareaId)
    {
        var query = db.GitHubPRs.Where(p => p.RepoId == id);
        if (tareaId.HasValue) query = query.Where(p => p.TareaId == tareaId);

        var prs = await query.OrderByDescending(p => p.FechaCreacion).ToListAsync();
        return Ok(prs.Select(ToPrDto).ToList());
    }

    [HttpPatch("commits/{id:int}/tarea")]
    [Authorize(Roles = "ESTUDIANTE")]
    public async Task<IActionResult> VincularCommit(int id, VincularEvidenciaDto dto)
    {
        var commit = await db.GitHubCommits.FindAsync(id);
        if (commit is null) return NotFound();

        commit.TareaId = dto.TareaId;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("prs/{id:int}/tarea")]
    [Authorize(Roles = "ESTUDIANTE")]
    public async Task<IActionResult> VincularPr(int id, VincularEvidenciaDto dto)
    {
        var pr = await db.GitHubPRs.FindAsync(id);
        if (pr is null) return NotFound();

        pr.TareaId = dto.TareaId;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static GitHubRepoDto ToRepoDto(GitHubRepo r) => new(r.Id, r.RepoFullName, r.ProyectoId, r.VinculadoPorId, r.UltimaSincronizacion);
    private static GitHubCommitDto ToCommitDto(GitHubCommit c) => new(c.Id, c.Sha, c.Mensaje, c.AutorGitHub, c.Url, c.FechaCommit, c.RepoId, c.TareaId);
    private static GitHubPrDto ToPrDto(GitHubPR p) => new(p.Id, p.NumeroPR, p.Titulo, p.AutorGitHub, p.Url, p.Estado, p.FechaCreacion, p.FechaCierre, p.RepoId, p.TareaId);
}
