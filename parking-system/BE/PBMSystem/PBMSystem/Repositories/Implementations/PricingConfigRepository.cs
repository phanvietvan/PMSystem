using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Implementations
{
    public class PricingConfigRepository : IPricingConfigRepository
    {
        private readonly AppDbContext _context;

        public PricingConfigRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<PricingConfig>> GetAllAsync()
        {
            return await _context.PricingConfigs
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task SoftDeleteAllAsync()
        {
            var configs = await _context.PricingConfigs
                .IgnoreQueryFilters()
                .ToListAsync();

            foreach (var config in configs)
            {
                config.IsDeleted = true;
            }
        }

        public async Task AddRangeAsync(
            IEnumerable<PricingConfig> configs)
        {
            await _context.PricingConfigs.AddRangeAsync(configs);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
