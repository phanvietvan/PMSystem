using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.DTOs
{
    public class VnPayCallbackResponse
    {
        public bool IsPaid { get; set; }

        public string? TransactionNo { get; set; }

        public string? TxnRef { get; set; }

        public decimal Amount { get; set; }

        public string Message { get; set; } = string.Empty;

        public string? ResponseCode { get; set; }
    }
}
