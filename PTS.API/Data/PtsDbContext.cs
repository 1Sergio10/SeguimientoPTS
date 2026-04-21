using Microsoft.EntityFrameworkCore;
using PTS.API.Models;

namespace PTS.API.Data;

public class PtsDbContext(DbContextOptions<PtsDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Clase> Clases => Set<Clase>();
    public DbSet<Grupo> Grupos => Set<Grupo>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<Tarea> Tareas => Set<Tarea>();

    public DbSet<GitHubRepo> GitHubRepos => Set<GitHubRepo>();
    public DbSet<GitHubCommit> GitHubCommits => Set<GitHubCommit>();
    public DbSet<GitHubPR> GitHubPRs => Set<GitHubPR>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Clase>()
            .HasOne(c => c.Profesor)
            .WithMany()
            .HasForeignKey(c => c.ProfesorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Clase>()
            .HasIndex(c => c.ProfesorId)
            .IsUnique();

        modelBuilder.Entity<Grupo>()
            .HasOne(g => g.Clase)
            .WithMany(c => c.Grupos)
            .HasForeignKey(g => g.ClaseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Grupo)
            .WithMany(g => g.Integrantes)
            .HasForeignKey(u => u.GrupoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Proyecto>()
            .HasOne(p => p.Grupo)
            .WithOne(g => g.Proyecto)
            .HasForeignKey<Proyecto>(p => p.GrupoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Proyecto>()
            .HasIndex(p => p.GrupoId)
            .IsUnique();

        modelBuilder.Entity<Sprint>()
            .HasOne(s => s.Proyecto)
            .WithMany(p => p.Sprints)
            .HasForeignKey(s => s.ProyectoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Tarea>()
            .HasOne(t => t.Sprint)
            .WithMany(s => s.Tareas)
            .HasForeignKey(t => t.SprintId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Tarea>()
            .HasOne(t => t.CreadaPor)
            .WithMany(u => u.TareasCreadas)
            .HasForeignKey(t => t.CreadaPorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Tarea>()
            .HasOne(t => t.AsignadoA)
            .WithMany(u => u.TareasAsignadas)
            .HasForeignKey(t => t.AsignadoAId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<GitHubRepo>()
            .HasOne(r => r.Proyecto)
            .WithMany()
            .HasForeignKey(r => r.ProyectoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GitHubRepo>()
            .HasIndex(r => r.ProyectoId)
            .IsUnique();

        modelBuilder.Entity<GitHubRepo>()
            .HasOne(r => r.VinculadoPor)
            .WithMany()
            .HasForeignKey(r => r.VinculadoPorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GitHubCommit>()
            .HasOne(c => c.Repo)
            .WithMany(r => r.Commits)
            .HasForeignKey(c => c.RepoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GitHubCommit>()
            .HasIndex(c => new { c.RepoId, c.Sha })
            .IsUnique();

        modelBuilder.Entity<GitHubPR>()
            .HasOne(p => p.Repo)
            .WithMany(r => r.PRs)
            .HasForeignKey(p => p.RepoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GitHubPR>()
            .HasIndex(p => new { p.RepoId, p.NumeroPR })
            .IsUnique();
    }
}
