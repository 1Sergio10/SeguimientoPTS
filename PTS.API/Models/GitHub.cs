namespace PTS.API.Models;

public class GitHubRepo
{
    public int Id { get; set; }
    public string RepoFullName { get; set; } = string.Empty;
    public int ProyectoId { get; set; }
    public int VinculadoPorId { get; set; }
    public DateTime? UltimaSincronizacion { get; set; }

    public Proyecto Proyecto { get; set; } = null!;
    public Usuario VinculadoPor { get; set; } = null!;
    public ICollection<GitHubCommit> Commits { get; set; } = [];
    public ICollection<GitHubPR> PRs { get; set; } = [];
}

public class GitHubCommit
{
    public int Id { get; set; }
    public string Sha { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string AutorGitHub { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime FechaCommit { get; set; }
    public int RepoId { get; set; }
    public int? TareaId { get; set; }

    public GitHubRepo Repo { get; set; } = null!;
    public Tarea? Tarea { get; set; }
}

public class GitHubPR
{
    public int Id { get; set; }
    public int NumeroPR { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string AutorGitHub { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Estado { get; set; } = "open";
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaCierre { get; set; }
    public int RepoId { get; set; }
    public int? TareaId { get; set; }

    public GitHubRepo Repo { get; set; } = null!;
    public Tarea? Tarea { get; set; }
}
