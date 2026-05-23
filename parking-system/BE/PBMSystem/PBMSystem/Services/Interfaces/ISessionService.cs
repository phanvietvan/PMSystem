using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface ISessionService
    {
        Task<object> GetActiveAsync(Guid userId);

        Task<object> EndAsync(Guid id);

        Task<object> GetFeeAsync(Guid id);
    }
}
