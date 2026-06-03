using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PTS.API.Data;
using PTS.API.Models;
using PTS.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

var rawConnStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default faltante");

// Render entrega la connection string en formato URL (postgresql://user:pass@host/db)
// Npgsql necesita formato key=value
string connStr = rawConnStr;
if (rawConnStr.StartsWith("postgresql://") || rawConnStr.StartsWith("postgres://"))
{
    var uri = new Uri(rawConnStr);
    var userInfo = uri.UserInfo.Split(':', 2);
    connStr = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};" +
              $"Database={uri.AbsolutePath.TrimStart('/')};" +
              $"Username={userInfo[0]};Password={Uri.UnescapeDataString(userInfo[1])};" +
              $"SSL Mode=Require;Trust Server Certificate=true";
}

builder.Services.AddDbContext<PtsDbContext>(opt => opt.UseNpgsql(connStr));

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IGitHubService, GitHubService>();
builder.Services.AddHttpClient<IGitHubService, GitHubService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key faltante");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("frontend", p =>
        p.SetIsOriginAllowed(origin =>
        {
            var uri = new Uri(origin);
            return uri.Host == "localhost" || uri.Host.EndsWith(".onrender.com");
        })
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PTS API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PtsDbContext>();
    db.Database.Migrate();

    if (!db.Usuarios.Any(u => u.Email == "profesor@pts.local"))
    {
        db.Usuarios.Add(new Usuario
        {
            Nombre = "Profesor Demo",
            Email = "profesor@pts.local",
            Rol = Rol.PROFESOR,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678")
        });
        db.SaveChanges();
    }

    if (!db.Usuarios.Any(u => u.Email == "estudiante@pts.local"))
    {
        db.Usuarios.Add(new Usuario
        {
            Nombre = "Estudiante Demo",
            Email = "estudiante@pts.local",
            Rol = Rol.ESTUDIANTE,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678")
        });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<PtsDbContext>();

    if (!db.Usuarios.Any())
    {
        var profesor = new Usuario
        {
            Nombre = "Profesor ",
            Email = "profesor@pts.local",
            Rol = Rol.PROFESOR,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678")
        };

        var estudiante = new Usuario
        {
            Nombre = "Estudiante ",
            Email = "estudiante@pts.local",
            Rol = Rol.ESTUDIANTE,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("12345678")
        };

        db.Usuarios.AddRange(profesor, estudiante);
        db.SaveChanges();
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
