using System.Net.Http.Headers;
using System.Text.Json;
using PTS.API.Models;

namespace PTS.API.Services;

public record GitHubCommitPayload(string Sha, string Mensaje, string Autor, string Url, DateTime FechaCommit);
public record GitHubPrPayload(int Numero, string Titulo, string Autor, string Url, string Estado, DateTime FechaCreacion, DateTime? FechaCierre);

public interface IGitHubService
{
    Task<List<GitHubCommitPayload>> ObtenerCommitsAsync(string repoFullName, CancellationToken ct = default);
    Task<List<GitHubPrPayload>> ObtenerPrsAsync(string repoFullName, CancellationToken ct = default);
}

public class GitHubService(HttpClient httpClient, IConfiguration config) : IGitHubService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<List<GitHubCommitPayload>> ObtenerCommitsAsync(string repoFullName, CancellationToken ct = default)
    {
        var req = BuildRequest($"https://api.github.com/repos/{repoFullName}/commits?per_page=50");
        using var res = await httpClient.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();

        using var stream = await res.Content.ReadAsStreamAsync(ct);
        var data = await JsonSerializer.DeserializeAsync<List<CommitResponse>>(stream, JsonOptions, ct) ?? [];
        return data.Select(c => new GitHubCommitPayload(
            c.sha,
            c.commit.message,
            c.commit.author?.name ?? c.author?.login ?? "unknown",
            c.html_url,
            c.commit.author?.date ?? DateTime.UtcNow
        )).ToList();
    }

    public async Task<List<GitHubPrPayload>> ObtenerPrsAsync(string repoFullName, CancellationToken ct = default)
    {
        var req = BuildRequest($"https://api.github.com/repos/{repoFullName}/pulls?state=all&per_page=50");
        using var res = await httpClient.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();

        using var stream = await res.Content.ReadAsStreamAsync(ct);
        var data = await JsonSerializer.DeserializeAsync<List<PrResponse>>(stream, JsonOptions, ct) ?? [];
        return data.Select(p => new GitHubPrPayload(
            p.number,
            p.title,
            p.user?.login ?? "unknown",
            p.html_url,
            p.state,
            p.created_at,
            p.closed_at
        )).ToList();
    }

    private HttpRequestMessage BuildRequest(string url)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.UserAgent.ParseAdd("PTSTrack/1.0");

        var token = config["GitHub:Token"];
        if (!string.IsNullOrWhiteSpace(token))
        {
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return req;
    }

    private sealed class CommitResponse
    {
        public string sha { get; set; } = string.Empty;
        public string html_url { get; set; } = string.Empty;
        public CommitData commit { get; set; } = new();
        public AuthorData? author { get; set; }
    }

    private sealed class CommitData
    {
        public string message { get; set; } = string.Empty;
        public AuthorInfo? author { get; set; }
    }

    private sealed class AuthorInfo
    {
        public string name { get; set; } = string.Empty;
        public DateTime date { get; set; }
    }

    private sealed class AuthorData
    {
        public string login { get; set; } = string.Empty;
    }

    private sealed class PrResponse
    {
        public int number { get; set; }
        public string title { get; set; } = string.Empty;
        public string html_url { get; set; } = string.Empty;
        public string state { get; set; } = "open";
        public DateTime created_at { get; set; }
        public DateTime? closed_at { get; set; }
        public AuthorData? user { get; set; }
    }
}
