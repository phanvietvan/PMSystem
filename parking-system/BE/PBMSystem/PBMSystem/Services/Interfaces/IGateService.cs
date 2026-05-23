using Repositories.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IGateService
    {
        Task<object> ScanAsync(GateScanRequest request);

        Task<object> GetStatusAsync();
    }
}
