using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Interfaces
{
    public interface IPricingConfigRepository
    {
        Task<List<PricingConfig>> GetAllAsync();

        Task SoftDeleteAllAsync();

        Task AddRangeAsync(IEnumerable<PricingConfig> configs);

        Task SaveChangesAsync();
    }
}
