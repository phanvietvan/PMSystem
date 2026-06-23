using Repositories.DTOs;
using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IPricingConfigService
    {
        Task<ApiResponse<IEnumerable<PricingConfig>>> GetAllAsync();

        Task<ApiResponse<IEnumerable<PricingConfig>>> SaveAllAsync(
            List<PricingConfigDto> items);
    }
}
