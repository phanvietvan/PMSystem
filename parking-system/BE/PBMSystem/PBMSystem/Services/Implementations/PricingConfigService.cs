using Repositories.DTOs;
using Repositories.Entities;
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
            var existing =
                await _repository.GetAllIncludingDeletedAsync();

            foreach (var config in existing)
            {
                config.IsDeleted = true;
            }

            await _repository.SaveChangesAsync();

            foreach (var item in items)
            {
                var config = new PricingConfig
                {
                    Type = item.Type,
                    Price = item.Price,
                    Sub = item.Sub
                };

                await _repository.AddAsync(config);
            }

            await _repository.SaveChangesAsync();

            var updated = await _repository.GetAllAsync();

            return ApiResponse<IEnumerable<PricingConfig>>
                .Ok(updated, "Cập nhật bảng giá thành công.");
        }
    }
}
