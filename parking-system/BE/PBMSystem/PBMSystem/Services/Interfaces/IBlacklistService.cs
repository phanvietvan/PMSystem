using Repositories.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IBlacklistService
    {
        Task<ApiResponse<IEnumerable<BlacklistResponseDto>>> GetAllAsync();
        Task<ApiResponse<BlacklistResponseDto>> AddAsync(AddBlacklistDto dto, string addedBy);
        Task<ApiResponse<bool>> DeleteAsync(Guid id);
    }
}
