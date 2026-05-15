# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Render sets Root Directory as parking-system/BE
# Copy csproj and restore as distinct layers
COPY ["PBMSystem/PBMSystem/PBMSystem.API/PBMSystem.API.csproj", "PBMSystem/PBMSystem/PBMSystem.API/"]
COPY ["PBMSystem/PBMSystem/Repositories/Repositories.csproj", "PBMSystem/PBMSystem/Repositories/"]
COPY ["PBMSystem/PBMSystem/Services/Services.csproj", "PBMSystem/PBMSystem/Services/"]
RUN dotnet restore "PBMSystem/PBMSystem/PBMSystem.API/PBMSystem.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/PBMSystem/PBMSystem/PBMSystem.API"
RUN dotnet build "PBMSystem.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "PBMSystem.API.csproj" -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Render dynamically sets PORT, ASP.NET Core will read it via Environment.GetEnvironmentVariable("PORT")
ENV ASPNETCORE_ENVIRONMENT=Production

# Khởi tạo thư mục data (để chứa file db sqlite nếu dùng Persistent Disk trên Render)
RUN mkdir -p /app/data

ENTRYPOINT ["dotnet", "PBMSystem.API.dll"]
