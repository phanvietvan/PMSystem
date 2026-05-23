using Repositories.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class Gate : BaseEntity
    {
        public string GateCode { get; set; } = string.Empty;

        public GateType GateType { get; set; }

        public GateStatus Status { get; set; }
            = GateStatus.OPEN;

        public string? Location { get; set; }
    }
}
