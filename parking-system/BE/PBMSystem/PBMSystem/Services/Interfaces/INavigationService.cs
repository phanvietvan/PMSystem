using Repositories.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface INavigationService
    {
        Task<object> RouteAsync(
            NavigationRouteRequest request);

        Task<object> VerifySlotAsync(
            VerifySlotRequest request);
    }
}
