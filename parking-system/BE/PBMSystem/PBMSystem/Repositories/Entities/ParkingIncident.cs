using Repositories.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class ParkingIncident : BaseEntity
    {
        public Guid? SessionId { get; set; }

        public IncidentType IncidentType { get; set; }

        public string Description { get; set; } = string.Empty;

        public IncidentStatus Status { get; set; }
            = IncidentStatus.OPEN;

        public DateTime IncidentTime { get; set; }
            = DateTime.UtcNow;
    }
}
