using System;

namespace Repositories.DTOs
{
    public class AddBlacklistDto
    {
        public string PlateNumber { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }

    public class BlacklistResponseDto
    {
        public Guid Id { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string AddedBy { get; set; } = string.Empty;
    }
}
