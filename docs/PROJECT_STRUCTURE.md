# Estructura y convenciones del proyecto

## Objetivo

Mantener una organizacion simple, predecible y escalable para el frontend Angular y el backend ASP.NET Core.

## Frontend (Angular)

Ruta base: `src/app`

- `core/`: codigo transversal reutilizable.
- `features/`: funcionalidades por dominio de negocio.
- `layout/`: composicion visual compartida (shell, navbar, etc.).

### Reglas

1. Cada feature vive en su propia carpeta dentro de `features/`.
2. Evitar dependencias cruzadas entre features; usar `core/` para contratos comunes.
3. Ubicar servicios de infraestructura en `core/services`.
4. Mantener componentes especificos dentro de su feature.

## Backend (ASP.NET Core)

Ruta base: `PTS.API`

- `Controllers/`: endpoints HTTP.
- `Services/`: logica de negocio e integraciones.
- `Data/`: DbContext y configuracion de acceso a datos.
- `Models/`: entidades y enums de dominio.
- `DTOs/`: contratos de entrada/salida.
- `Migrations/`: historial EF Core.

### Reglas

1. Los controllers no deben contener logica de negocio compleja.
2. Los DTOs exponen el contrato HTTP; no devolver entidades EF directamente.
3. Mantener el acceso a datos centralizado mediante `PtsDbContext`.
4. Mantener enums y entidades del dominio agrupados en `Models/`.

## Artefactos fuera de versionado

No deben commitearse:

- `node_modules/`
- `dist/`
- `.angular/`
- `PTS.API/bin/`
- `PTS.API/obj/`

## Checklist antes de commit

1. El cambio pertenece a una feature o capa clara.
2. No se incluyen archivos generados.
3. Se actualiza documentacion si cambia estructura o flujo.
4. El nombre del commit describe claramente el impacto.
