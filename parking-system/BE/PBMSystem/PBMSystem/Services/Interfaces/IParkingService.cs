using Repositories.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IParkingService
    {
        Task<object> ScanGateAsync(GateScanRequest request);

        Task<object> GetGateStatusAsync();

        Task<object> GetRouteAsync(RouteRequest request);

        Task<object> VerifySlotAsync(
            VerifySlotRequest request);

        Task<object> GetActiveSessionAsync();

        Task<object> EndSessionAsync(Guid sessionId);

        Task<object> GetFeeAsync(Guid sessionId);

        Task<object> CreatePaymentAsync(
            CreatePaymentRequest request);

        Task<object> GetPaymentStatusAsync(Guid paymentId);
    }
}
