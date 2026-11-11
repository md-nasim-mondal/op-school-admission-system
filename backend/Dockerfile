# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Restore NuGet dependencies first so this layer caches unless .csproj files change
COPY src/SchoolAdmission.Domain/SchoolAdmission.Domain.csproj src/SchoolAdmission.Domain/
COPY src/SchoolAdmission.Application/SchoolAdmission.Application.csproj src/SchoolAdmission.Application/
COPY src/SchoolAdmission.Infrastructure/SchoolAdmission.Infrastructure.csproj src/SchoolAdmission.Infrastructure/
COPY src/SchoolAdmission.Api/SchoolAdmission.Api.csproj src/SchoolAdmission.Api/
RUN --mount=type=cache,target=/root/.nuget/packages dotnet restore src/SchoolAdmission.Api/SchoolAdmission.Api.csproj

COPY src/ src/
RUN --mount=type=cache,target=/root/.nuget/packages dotnet publish src/SchoolAdmission.Api/SchoolAdmission.Api.csproj -c Release --no-restore -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Install curl for docker healthcheck
RUN apk add --no-cache curl

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "SchoolAdmission.Api.dll"]
