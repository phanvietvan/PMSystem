using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class PricingConfigService : IPricingConfigService
    {
        private readonly IPricingConfigRepository _repository;

        public PricingConfigService(
            IPricingConfigRepository repository)
        {
            _repository = repository;
        }

        public async Task<ApiResponse<IEnumerable<PricingConfig>>> GetAllAsync()
        {
            var configs = await _repository.GetAllAsync();

            return ApiResponse<IEnumerable<PricingConfig>>
                .Ok(configs);
        }

        public async Task<ApiResponse<IEnumerable<PricingConfig>>> SaveAllAsync(
            List<PricingConfigDto> items)
        {
            await _repository.SoftDeleteAllAsync();
            await _repository.SaveChangesAsync();

            var newConfigs = items.Select(item => new PricingConfig
            {
                Type = item.Type,
                Price = PricingFeeCalculator.ParsePrice(item.Price),
                Sub = item.Sub
            }).ToList();

            await _repository.AddRangeAsync(newConfigs);
            await _repository.SaveChangesAsync();

            var updated = await _repository.GetAllAsync();

            return ApiResponse<IEnumerable<PricingConfig>>
                .Ok(updated, "Cập nhật bảng giá thành công.");
        }
    }
}
