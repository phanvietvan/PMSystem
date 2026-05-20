using Microsoft.Data.Sqlite;

if (args.Length < 2)
{
    Console.Error.WriteLine("Usage: PromoteAdmin <dbPath> <email> [role=2]");
    return 1;
}

var dbPath = args[0];
var email = args[1];
var role = args.Length > 2 ? args[2] : "2";

await using var connection = new SqliteConnection($"Data Source={dbPath}");
await connection.OpenAsync();

await using var command = connection.CreateCommand();
command.CommandText = "UPDATE Users SET Role = @role WHERE Email = @email";
command.Parameters.AddWithValue("@role", int.Parse(role));
command.Parameters.AddWithValue("@email", email.ToLower());

Console.Write(await command.ExecuteNonQueryAsync());
return 0;
