using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repositories.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeIncidents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reporter",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Incidents");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Incidents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_UserId",
                table: "Incidents",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_Users_UserId",
                table: "Incidents",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_Users_UserId",
                table: "Incidents");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_UserId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Incidents");

            migrationBuilder.AddColumn<string>(
                name: "Reporter",
                table: "Incidents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Incidents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
