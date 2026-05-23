using Repositories.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IPaymentService
    {
        Task<object> CreateAsync(
            CreatePaymentRequest request);

        Task<object> GetStatusAsync(Guid id);
    }
}
