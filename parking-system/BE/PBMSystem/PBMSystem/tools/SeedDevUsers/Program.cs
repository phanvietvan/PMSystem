using Microsoft.Data.Sqlite;

const string defaultPassword = "DevPass123!";
var dbPath = args.Length > 0
    ? args[0]
    : Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "PBMSystem.API", "pbmsystem_dev.db");

dbPath = Path.GetFullPath(dbPath);
if (!File.Exists(dbPath))
{
    Console.Error.WriteLine($"Database not found: {dbPath}");
    Console.Error.WriteLine("Apply migrations first, then seed:");
    Console.Error.WriteLine("  PowerShell: .\\scripts\\seed-dev-db.ps1");
    Console.Error.WriteLine("  Bash:       ./scripts/seed-dev-db.sh");
    Console.Error.WriteLine("  Or:         cd PBMSystem.API && dotnet ef database update --project ../Repositories");
    return 1;
}

var passwordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword);
var now = DateTime.UtcNow.ToString("o");

var users = new[]
{
    (Id: Guid.Parse("11111111-1111-1111-1111-111111111101"), Email: "user@pbm.dev", Username: "user_dev", Role: 0, First: "Dev", Last: "User"),
    (Id: Guid.Parse("11111111-1111-1111-1111-111111111102"), Email: "staff@pbm.dev", Username: "staff_dev", Role: 1, First: "Dev", Last: "Staff"),
    (Id: Guid.Parse("11111111-1111-1111-1111-111111111103"), Email: "admin@pbm.dev", Username: "admin_dev", Role: 2, First: "Dev", Last: "Admin"),
};

await using var connection = new SqliteConnection($"Data Source={dbPath}");
await connection.OpenAsync();

await using var clearTokens = connection.CreateCommand();
clearTokens.CommandText = "DELETE FROM RefreshTokens;";
await clearTokens.ExecuteNonQueryAsync();

await using var clearUsers = connection.CreateCommand();
clearUsers.CommandText = "DELETE FROM Users;";
await clearUsers.ExecuteNonQueryAsync();

foreach (var u in users)
{
    await using var insert = connection.CreateCommand();
    insert.CommandText = """
        INSERT INTO Users (
            Id, Email, Username, PasswordHash, FirstName, LastName,
            PhoneNumber, Address, Status, Role, LastLoginAt,
            OtpCode, OtpExpiry, OtpLastSentAt, CreatedAt, UpdatedAt, IsDeleted
        ) VALUES (
            @id, @email, @username, @hash, @first, @last,
            @phone, @address, 1, @role, NULL,
            NULL, NULL, NULL, @created, NULL, 0
        );
        """;
    insert.Parameters.AddWithValue("@id", u.Id.ToString());
    insert.Parameters.AddWithValue("@email", u.Email);
    insert.Parameters.AddWithValue("@username", u.Username);
    insert.Parameters.AddWithValue("@hash", passwordHash);
    insert.Parameters.AddWithValue("@first", u.First);
    insert.Parameters.AddWithValue("@last", u.Last);
    insert.Parameters.AddWithValue("@phone", "+84900000001");
    insert.Parameters.AddWithValue("@address", "1 Dev Seed Street");
    insert.Parameters.AddWithValue("@role", u.Role);
    insert.Parameters.AddWithValue("@created", now);
    await insert.ExecuteNonQueryAsync();
}

Console.WriteLine($"Seeded 3 users into: {dbPath}");
Console.WriteLine($"Password (all accounts): {defaultPassword}");
Console.WriteLine();
Console.WriteLine("  user@pbm.dev   / user_dev   (Role: User)");
Console.WriteLine("  staff@pbm.dev  / staff_dev  (Role: Staff)");
Console.WriteLine("  admin@pbm.dev  / admin_dev  (Role: Admin)");
return 0;
