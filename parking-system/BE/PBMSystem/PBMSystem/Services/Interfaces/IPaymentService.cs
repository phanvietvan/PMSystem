using Repositories.DTOs;
using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IPaymentService
    {
        Task<ApiResponse<IEnumerable<Payment>>> GetAllPaymentsAsync();

        Task<ApiResponse<Payment>> GetPaymentByIdAsync(Guid id);

        Task<ApiResponse<object>> CreateVnPayPaymentUrlAsync(
            VnPayCreatePaymentRequest request,
            string? clientIp);

        Task<ApiResponse<VnPayCallbackResponse>> VerifyVnPayPaymentAsync(
            IEnumerable<KeyValuePair<string, string>> requestParams);
    }
}
