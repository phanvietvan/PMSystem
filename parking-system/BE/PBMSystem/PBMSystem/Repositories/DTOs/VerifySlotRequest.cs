using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.DTOs
{
    public class VerifySlotRequest
    {
        public Guid SessionId { get; set; }

        public string SlotQrCode { get; set; } = string.Empty;
    }
}
