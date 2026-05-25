# =========================
# BUILD STAGE
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy csproj file and restore dependencies
COPY march/*.csproj ./march/

RUN dotnet restore march/march.csproj

# Copy all project files
COPY . .

# Move into project folder
WORKDIR /src/march

# Publish application
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false


# =========================
# RUNTIME STAGE
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Copy published files from build stage
COPY --from=build /app/publish .

# Render provides PORT automatically
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080}

# Expose application port
EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "march.dll"]