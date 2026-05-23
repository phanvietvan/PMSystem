using Repositories.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class Payment : BaseEntity
    {
        public Guid SessionId { get; set; }

        public decimal Amount { get; set; }

        public string Method { get; set; } = string.Empty;

        public PaymentStatus Status { get; set; }
            = PaymentStatus.PENDING;

        public string? TransactionCode { get; set; }

        public DateTime PaymentTime { get; set; }
            = DateTime.UtcNow;

        public ParkingSession? Session { get; set; }
    }
}
