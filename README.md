# PTS Track

Sistema de seguimiento de proyectos academicos con frontend en Angular y backend en ASP.NET Core.

## Arquitectura

- Frontend: Angular 21 (SPA)
- Backend: ASP.NET Core + EF Core + SQL Server
- Autenticacion: JWT Bearer
- Deployment: Render (servicio web para API + sitio estatico para frontend)

## Estructura del repositorio

```text
pts-track/
|- src/                          # Frontend Angular
|  |- app/
|  |  |- core/                   # Servicios base, modelos, interceptores, guards
|  |  |- features/               # Modulos por dominio (auth, dashboard, grupos, etc.)
|  |  |- layout/                 # Layout principal
|  |- environments/
|- public/                       # Assets estaticos frontend
|- PTS.API/                      # Backend ASP.NET Core
|  |- Controllers/
|  |- Data/
|  |- DTOs/
|  |- Migrations/
|  |- Models/
|  |- Services/
|  |- Program.cs
|  |- appsettings.json
|- docs/                         # Documentacion de estructura y convenciones
|- angular.json
|- package.json
|- render.yaml
```

## Requisitos

- Node.js 20+
- npm 10+
- .NET SDK 10
- SQL Server (local o remoto)

## Configuracion local

### 1) Frontend

```bash
npm install
```

### 2) Backend

Configura la cadena de conexion y JWT en [PTS.API/appsettings.json](PTS.API/appsettings.json).

Valores clave:

- ConnectionStrings:Default
- Jwt:Key
- Jwt:Issuer
- Jwt:Audience

## Ejecutar en desarrollo

### Backend

```bash
dotnet run --project PTS.API/PTS.API.csproj --urls http://localhost:5000
```

### Frontend

```bash
npm start
```

Aplicacion en: http://localhost:4200

## Credenciales de desarrollo

En entorno Development, la API siembra usuarios demo cuando la tabla de usuarios esta vacia:

- profesor@pts.local / 12345678
- estudiante@pts.local / 12345678

Nota: en Production no se ejecuta esta siembra automatica.

## Scripts utiles

- `npm start`: levanta Angular en modo desarrollo
- `npm run build`: build de frontend
- `npm test`: pruebas unitarias frontend

## Convenciones de organizacion

- Frontend por dominio funcional dentro de `src/app/features`.
- Logica transversal en `src/app/core`.
- Backend por capas simples: `Controllers`, `Services`, `Data`, `Models`, `DTOs`.
- Archivos generados (`bin`, `obj`, `dist`, caches) no se versionan.

Mas detalle en [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Deploy (Render)

Definido en [render.yaml](render.yaml):

- `pts-api`: servicio Docker para ASP.NET Core
- `pts-web`: sitio estatico para frontend Angular

Variables recomendadas en Render:

- `JWT__KEY`
- `JWT__ISSUER`
- `JWT__AUDIENCE`
- `ConnectionStrings__DefaultConnection`

## Estado del repositorio

Se recomienda mantener limpio el arbol de codigo fuente y evitar versionar artefactos de compilacion para facilitar revisiones y despliegues.
