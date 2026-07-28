using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Helpers;
using Repositories.Interfaces;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class BlacklistService : IBlacklistService
    {
        private readonly IBlacklistRepository _blacklistRepository;

        public BlacklistService(IBlacklistRepository blacklistRepository)
        {
            _blacklistRepository = blacklistRepository;
        }

        public async Task<ApiResponse<IEnumerable<BlacklistResponseDto>>> GetAllAsync()
        {
            var list = await _blacklistRepository.GetAllAsync();
            var sortedList = list.OrderByDescending(x => x.CreatedAt);

            var mappedList = sortedList.Select(x => new BlacklistResponseDto
            {
                Id = x.Id,
                PlateNumber = x.PlateNumber,
                Reason = x.Reason,
                Date = x.CreatedAt.ToString("yyyy-MM-dd"),
                AddedBy = x.AddedBy ?? "Admin"
            });

            return ApiResponse<IEnumerable<BlacklistResponseDto>>.Ok(mappedList);
        }

        public async Task<ApiResponse<BlacklistResponseDto>> AddAsync(AddBlacklistDto dto, string addedBy)
        {
            if (string.IsNullOrWhiteSpace(dto.PlateNumber) || string.IsNullOrWhiteSpace(dto.Reason))
            {
                return ApiResponse<BlacklistResponseDto>.Fail("Plate number and reason are required.");
            }

            var entry = new BlacklistEntry
            {
                Id = Guid.NewGuid(),
                PlateNumber = dto.PlateNumber.Trim().ToUpper(),
                Reason = dto.Reason,
                AddedBy = addedBy,
                CreatedAt = VietnamTime.Now,
                UpdatedAt = VietnamTime.Now
            };

            await _blacklistRepository.AddAsync(entry);
            await _blacklistRepository.SaveChangesAsync();

            var responseDto = new BlacklistResponseDto
            {
                Id = entry.Id,
                PlateNumber = entry.PlateNumber,
                Reason = entry.Reason,
                Date = entry.CreatedAt.ToString("yyyy-MM-dd"),
                AddedBy = entry.AddedBy ?? "Admin"
            };

            return ApiResponse<BlacklistResponseDto>.Ok(responseDto, "Blacklist entry added successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteAsync(Guid id)
        {
            var entry = await _blacklistRepository.GetByIdAsync(id);
            if (entry == null)
            {
                return ApiResponse<bool>.Fail("Entry not found.");
            }

            _blacklistRepository.Remove(entry);
            await _blacklistRepository.SaveChangesAsync();

            return ApiResponse<bool>.Ok(true, "Removed successfully.");
        }
    }
}
