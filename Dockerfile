# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY march/*.csproj ./march/
RUN dotnet restore march/march.csproj

# Copy everything else and build
COPY . .
WORKDIR /src/march
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy the published output
COPY --from=build /app/publish ./

# Configure environment: Render provides PORT variable at runtime
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT:-5000}

# Automatically detect the built DLL name (project assembly) and use it in ENTRYPOINT
# The publish step places a single DLL named after the project. Use a shell to find it.
ENTRYPOINT ["/bin/sh", "-c", "exec dotnet $(ls *.dll | grep -v \"refs\")"]
