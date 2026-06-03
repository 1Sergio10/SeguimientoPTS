# Stage 1: Build Angular
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build .NET
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src
COPY PTS.API/PTS.API.csproj ./
RUN dotnet restore
COPY PTS.API/ ./
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Final
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=backend /app/publish ./
COPY --from=frontend /app/dist/pts-track/browser ./wwwroot
ENTRYPOINT ["dotnet", "PTS.API.dll"]
