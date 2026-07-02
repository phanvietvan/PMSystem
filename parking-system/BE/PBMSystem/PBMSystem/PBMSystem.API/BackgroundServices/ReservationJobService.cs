using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Interfaces;

namespace PBMSystem.API.BackgroundServices
{
    public class ReservationJobService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReservationJobService> _logger;

        public ReservationJobService(IServiceProvider serviceProvider, ILogger<ReservationJobService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Reservation Job Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessReservationsAsync(stoppingToken);
                    await ProcessCheckedInExtensionsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing Reservation Job.");
                }

                // Chờ 1 phút để kiểm tra lại
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("Reservation Job Service is stopping.");
        }

        private async Task ProcessReservationsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var sessionService = scope.ServiceProvider.GetRequiredService<IParkingSessionService>();
            await sessionService.ProcessReservationsAsync();
        }

        private async Task ProcessCheckedInExtensionsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var sessionService = scope.ServiceProvider.GetRequiredService<IParkingSessionService>();
            await sessionService.ProcessCheckedInExtensionsAsync();
        }
    }
}
