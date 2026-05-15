# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["PBMSystem.API/PBMSystem.API.csproj", "PBMSystem.API/"]
COPY ["Repositories/Repositories.csproj", "Repositories/"]
COPY ["Services/Services.csproj", "Services/"]
RUN dotnet restore "PBMSystem.API/PBMSystem.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/PBMSystem.API"
RUN dotnet build "PBMSystem.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "PBMSystem.API.csproj" -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Render dynamically sets PORT, API will read it via Environment.GetEnvironmentVariable("PORT")
ENV ASPNETCORE_ENVIRONMENT=Production

# Khởi tạo thư mục data (để chứa file db sqlite nếu bạn dùng Persistent Disk trên Render)
RUN mkdir -p /app/data

ENTRYPOINT ["dotnet", "PBMSystem.API.dll"]
