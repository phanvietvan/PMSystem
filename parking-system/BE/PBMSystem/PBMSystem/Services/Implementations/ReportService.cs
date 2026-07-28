using Microsoft.EntityFrameworkCore;
using Repositories;
using System.Text.Json;

namespace Services.Implementations;

public class ReportService : Interfaces.IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetDashboardReportsAsync()
    {
        var sessions = await _context.ParkingSessions.ToListAsync();

        var totalCount = sessions.Count;
        var currentMonth = DateTime.Now.Month;
        var currentYear = DateTime.Now.Year;

        var currentMonthSessions = sessions
            .Where(s => s.EntryTime.Month == currentMonth && s.EntryTime.Year == currentYear)
            .ToList();

        var lastMonthSessions = sessions
            .Where(s =>
                s.EntryTime.Month == (currentMonth == 1 ? 12 : currentMonth - 1) &&
                s.EntryTime.Year == (currentMonth == 1 ? currentYear - 1 : currentYear))
            .ToList();

        var currentMonthRevenue = currentMonthSessions
            .Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType) : 0m));

        var lastMonthRevenue = lastMonthSessions
            .Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType) : 0m));

        var growth = lastMonthRevenue == 0
            ? 100.0
            : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100.0;

        var activeSessions = sessions.Count(s => s.Status == "Active");
        var occupancyRate = (activeSessions / 174.0) * 100;

        var monthlyData = new List<object>();

        for (int i = 6; i >= 0; i--)
        {
            var targetDate = DateTime.Today.AddDays(-i);

            var dSessions = sessions
                .Where(s => s.ExitTime.HasValue && s.ExitTime.Value.Date == targetDate.Date);

            var dRevenue = dSessions
                .Sum(s => (double)CalculateFee(s.EntryTime, s.ExitTime!.Value, s.VehicleType));

            var lastWeekDate = targetDate.AddDays(-7);

            var lastWeekSessions = sessions
                .Where(s => s.ExitTime.HasValue && s.ExitTime.Value.Date == lastWeekDate.Date);

            var lastWeekRevenue = lastWeekSessions
                .Sum(s => (double)CalculateFee(s.EntryTime, s.ExitTime!.Value, s.VehicleType));

            monthlyData.Add(new
            {
                month = targetDate.ToString("dd/MM"),
                current = dRevenue,
                lastYear = lastWeekRevenue,
                active = i == 0,
                forecast = false
            });
        }

        var zones = sessions
            .Where(s => !string.IsNullOrEmpty(s.ParkingLotName))
            .GroupBy(s => s.ParkingLotName)
            .Select(g => new
            {
                id = GetZoneId(g.Key!),
                name = g.Key,
                count = g.Count().ToString("N0"),
                revenueValue = g.Sum(s =>
                    (double)(s.ExitTime.HasValue
                        ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType)
                        : 0m)),
                revenue = FormatRevenue(g.Sum(s =>
                    (double)(s.ExitTime.HasValue
                        ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType)
                        : 0m)))
            })
            .OrderByDescending(z => z.revenueValue)
            .Take(4)
            .Select(z => new
            {
                z.id,
                z.name,
                z.count,
                z.revenue
            })
            .ToList();

        object zonesList = zones;

        if (!zones.Any())
        {
            zonesList = new List<object>
            {
                new
                {
                    id = "A1",
                    name = "Landmark 81 - Bãi đỗ A1",
                    count = "0",
                    revenue = "0 ₫"
                }
            };
        }

        var heatmapData = new int[4, 7];
        var last30DaysSessions = sessions
            .Where(s => s.EntryTime >= DateTime.Now.AddDays(-30))
            .ToList();

        foreach (var session in last30DaysSessions)
        {
            var localTime = session.EntryTime.ToLocalTime();

            int dayOfWeek = (int)localTime.DayOfWeek;
            int col = dayOfWeek == 0 ? 6 : dayOfWeek - 1;

            int hour = localTime.Hour;
            int row = 3;

            if (hour >= 6 && hour < 12)
                row = 0;
            else if (hour >= 12 && hour < 14)
                row = 1;
            else if (hour >= 14 && hour < 18)
                row = 2;

            heatmapData[row, col]++;
        }

        var heatmapColors = new List<string>();
        int maxDensity = 1;

        for (int r = 0; r < 4; r++)
            for (int c = 0; c < 7; c++)
                if (heatmapData[r, c] > maxDensity)
                    maxDensity = heatmapData[r, c];

        for (int r = 0; r < 4; r++)
        {
            for (int c = 0; c < 7; c++)
            {
                double ratio = (double)heatmapData[r, c] / maxDensity;

                string color = "bg-blue-50";

                if (ratio > 0.8)
                    color = "bg-slate-900";
                else if (ratio > 0.6)
                    color = "bg-blue-600";
                else if (ratio > 0.4)
                    color = "bg-blue-400";
                else if (ratio > 0.2)
                    color = "bg-blue-200";
                else if (ratio > 0.05)
                    color = "bg-blue-100";

                heatmapColors.Add(color);
            }
        }

        string aiForecast = "Tải trọng dự kiến ổn định, không có biến động lớn.";

        if (growth > 10)
        {
            aiForecast = $"Tải trọng dự kiến tăng {growth:F0}% do nhu cầu gửi xe tăng cao.";
        }
        else if (growth < -10)
        {
            aiForecast = $"Tải trọng dự kiến giảm {Math.Abs(growth):F0}% so với chu kỳ trước.";
        }
        else if (currentMonthSessions.Count > 0)
        {
            var weekendCount = currentMonthSessions.Count(s =>
                s.EntryTime.DayOfWeek == DayOfWeek.Saturday ||
                s.EntryTime.DayOfWeek == DayOfWeek.Sunday);

            var weekdayCount = currentMonthSessions.Count - weekendCount;

            if (weekendCount * 2.5 > weekdayCount)
            {
                aiForecast = "Tải trọng dự kiến tăng mạnh vào cuối tuần do sự kiện khu vực.";
            }
        }

        return new
        {
            summary = new
            {
                totalCount = totalCount,
                growth = growth > 0 ? $"+{growth:F1}%" : $"{growth:F1}%",
                occupancyRate = $"{occupancyRate:F1}%"
            },
            monthlyData = monthlyData,
            zones = zonesList,
            heatmapColors = heatmapColors,
            aiForecast = aiForecast
        };
    }

    private string GetZoneId(string name)
    {
        if (name.Contains("A1")) return "A1";
        if (name.Contains("B2")) return "B2";
        if (name.Contains("V3")) return "V3";
        if (name.Contains("S1")) return "S1";
        if (name.Contains("L1")) return "L1";
        if (name.Contains("C1")) return "C1";

        return "Z1";
    }

    private string FormatRevenue(double amount)
    {
        if (amount >= 1000000)
            return (amount / 1000000).ToString("F1") + "tr ₫";

        if (amount >= 1000)
            return (amount / 1000).ToString("F0") + "k ₫";

        return amount.ToString("N0") + " ₫";
    }

    private decimal CalculateFee(DateTime entryTime, DateTime exitTime, string? vehicleType)
    {
        try
        {
            var configs = _context.PricingConfigs.Where(p => !p.IsDeleted).ToList();
            if (configs.Count > 0)
                return PricingFeeCalculator.CalculateFromConfigs(entryTime, exitTime, vehicleType, configs);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Report CalculateFee DB failed: " + ex.Message);
        }

        try
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
            if (File.Exists(path))
            {
                var json = File.ReadAllText(path);
                return PricingFeeCalculator.CalculateFromJsonArray(entryTime, exitTime, vehicleType, json);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Report CalculateFee file failed: " + ex.Message);
        }

        return PricingFeeCalculator.Calculate(entryTime, exitTime, vehicleType, Array.Empty<(string, decimal, string)>());
    }
}