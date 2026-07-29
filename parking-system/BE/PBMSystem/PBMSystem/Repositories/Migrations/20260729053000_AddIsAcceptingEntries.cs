using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations;

/// <inheritdoc />
public partial class AddIsAcceptingEntries : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsAcceptingEntries",
            table: "ParkingLots",
            type: "bit",
            nullable: false,
            defaultValue: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "IsAcceptingEntries",
            table: "ParkingLots");
    }
}
