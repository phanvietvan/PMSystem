using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardReports()
    {
        var sessions = await _context.ParkingSessions.ToListAsync();

        // 1. Summary
        var totalCount = sessions.Count;
        var currentMonth = DateTime.Now.Month;
        var currentYear = DateTime.Now.Year;
        
        var currentMonthSessions = sessions.Where(s => s.EntryTime.Month == currentMonth && s.EntryTime.Year == currentYear).ToList();
        var lastMonthSessions = sessions.Where(s => s.EntryTime.Month == (currentMonth == 1 ? 12 : currentMonth - 1) && s.EntryTime.Year == (currentMonth == 1 ? currentYear - 1 : currentYear)).ToList();
        
        var currentMonthRevenue = currentMonthSessions.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType) : 0m));
        var lastMonthRevenue = lastMonthSessions.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType) : 0m));
        var growth = lastMonthRevenue == 0 ? 100.0 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100.0;

        // Peak Occupancy
        var activeSessions = sessions.Count(s => s.Status == "Active");
        // Capacity logic: Assuming total capacity of all 7 buildings is 174
        var occupancyRate = (activeSessions / 174.0) * 100;

        // 2. Daily Data for Chart (last 7 days)
        var monthlyData = new List<object>();
        for (int i = 6; i >= 0; i--)
        {
            var targetDate = DateTime.Today.AddDays(-i);
            var dSessions = sessions.Where(s => s.ExitTime.HasValue && s.ExitTime.Value.Date == targetDate.Date);
            var dRevenue = dSessions.Sum(s => (double)CalculateFee(s.EntryTime, s.ExitTime!.Value, s.VehicleType));
            
            var lastWeekDate = targetDate.AddDays(-7);
            var lastWeekSessions = sessions.Where(s => s.ExitTime.HasValue && s.ExitTime.Value.Date == lastWeekDate.Date);
            var lastWeekRevenue = lastWeekSessions.Sum(s => (double)CalculateFee(s.EntryTime, s.ExitTime!.Value, s.VehicleType));

            monthlyData.Add(new {
                month = targetDate.ToString("dd/MM"),
                current = dRevenue,
                lastYear = lastWeekRevenue,
                active = i == 0,
                forecast = false
            });
        }

        // 3. Zone Performance
        var zones = sessions
            .Where(s => !string.IsNullOrEmpty(s.ParkingLotName))
            .GroupBy(s => s.ParkingLotName)
            .Select(g => new {
                id = GetZoneId(g.Key!),
                name = g.Key,
                count = g.Count().ToString("N0"),
                revenueValue = g.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType) : 0m)),
                revenue = FormatRevenue(g.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value, s.VehicleType) : 0m)))
            })
            .OrderByDescending(z => z.revenueValue)
            .Take(4)
            .Select(z => new { z.id, z.name, z.count, z.revenue })
            .ToList();

        object zonesList = zones;
        if (!zones.Any())
        {
            zonesList = new List<object> {
                new { id = "A1", name = "Landmark 81 - Bãi đỗ A1", count = "0", revenue = "0 ₫" }
            };
        }

        // 4. Heatmap Logic
        var heatmapData = new int[4, 7]; // 4 rows (Morning, Noon, Afternoon, Night), 7 cols (Mon-Sun)
        var last30DaysSessions = sessions.Where(s => s.EntryTime >= DateTime.Now.AddDays(-30)).ToList();
        
        foreach(var session in last30DaysSessions)
        {
            var localTime = session.EntryTime.ToLocalTime();
            int dayOfWeek = (int)localTime.DayOfWeek; // 0: Sun, 1: Mon, ...
            int col = dayOfWeek == 0 ? 6 : dayOfWeek - 1; // Map to 0: Mon ... 6: Sun
            
            int hour = localTime.Hour;
            int row = 3; // Night by default (18-05)
            if (hour >= 6 && hour < 12) row = 0; // Morning
            else if (hour >= 12 && hour < 14) row = 1; // Noon
            else if (hour >= 14 && hour < 18) row = 2; // Afternoon

            heatmapData[row, col]++;
        }

        // Convert counts to colors
        var heatmapColors = new List<string>();
        int maxDensity = 1;
        for (int r = 0; r < 4; r++)
            for (int c = 0; c < 7; c++)
                if (heatmapData[r, c] > maxDensity) maxDensity = heatmapData[r, c];

        for (int r = 0; r < 4; r++)
        {
            for (int c = 0; c < 7; c++)
            {
                double ratio = (double)heatmapData[r, c] / maxDensity;
                string color = "bg-blue-50"; // lowest
                if (ratio > 0.8) color = "bg-slate-900";
                else if (ratio > 0.6) color = "bg-blue-600";
                else if (ratio > 0.4) color = "bg-blue-400";
                else if (ratio > 0.2) color = "bg-blue-200";
                else if (ratio > 0.05) color = "bg-blue-100";
                
                heatmapColors.Add(color);
            }
        }

        // 5. AI Forecast Logic
        string aiForecast = "Tải trọng dự kiến ổn định, không có biến động lớn.";
        if (growth > 10) {
            aiForecast = $"Tải trọng dự kiến tăng {growth:F0}% do nhu cầu gửi xe tăng cao.";
        } else if (growth < -10) {
            aiForecast = $"Tải trọng dự kiến giảm {Math.Abs(growth):F0}% so với chu kỳ trước.";
        } else if (currentMonthSessions.Count > 0) {
             // Simple logic based on weekends
             var weekendCount = currentMonthSessions.Count(s => s.EntryTime.DayOfWeek == DayOfWeek.Saturday || s.EntryTime.DayOfWeek == DayOfWeek.Sunday);
             var weekdayCount = currentMonthSessions.Count - weekendCount;
             if (weekendCount * 2.5 > weekdayCount) { // If weekends are disproportionately busy
                 aiForecast = "Tải trọng dự kiến tăng mạnh vào cuối tuần do sự kiện khu vực.";
             }
        }

        return Ok(new {
            summary = new {
                totalCount = totalCount,
                growth = growth > 0 ? $"+{growth:F1}%" : $"{growth:F1}%",
                occupancyRate = $"{occupancyRate:F1}%"
            },
            monthlyData = monthlyData,
            zones = zonesList,
            heatmapColors = heatmapColors,
            aiForecast = aiForecast
        });
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
        if (amount >= 1000000) return (amount / 1000000).ToString("F1") + "tr ₫";
        if (amount >= 1000) return (amount / 1000).ToString("F0") + "k ₫";
        return amount.ToString("N0") + " ₫";
    }

    private decimal CalculateFee(DateTime entryTime, DateTime exitTime, string? vehicleType)
    {
        var elapsed = exitTime - entryTime;
        var elapsedMinutes = (int)Math.Ceiling(elapsed.TotalMinutes);

        decimal baseRate = 10000;
        bool isHourly = true;

        try
        {
            var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
            if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                var doc = System.Text.Json.JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    string targetType = (vehicleType ?? "car").ToLower();
                    System.Text.Json.JsonElement matchedElement = default;
                    bool found = false;

                    foreach (var elem in root.EnumerateArray())
                    {
                        var typeProp = elem.GetProperty("type").GetString() ?? "";
                        var typeLower = typeProp.ToLower();
                        if (targetType == "bike" && (typeLower.Contains("xe máy") || typeLower.Contains("bike")))
                        {
                            matchedElement = elem;
                            found = true;
                            break;
                        }
                        else if (targetType == "car" && (typeLower.Contains("ô tô") || typeLower.Contains("car") || typeLower.Contains("4-7")))
                        {
                            matchedElement = elem;
                            found = true;
                            break;
                        }
                        else if (targetType == "suv" && (typeLower.Contains("suv") || typeLower.Contains("bán tải")))
                        {
                            matchedElement = elem;
                            found = true;
                            break;
                        }
                    }

                    if (found)
                    {
                        var priceStr = matchedElement.GetProperty("price").GetString() ?? "10000";
                        var subStr = matchedElement.GetProperty("sub").GetString() ?? "Giờ";

                        var cleanPrice = priceStr.Replace(".", "").Replace(",", "").Trim();
                        if (decimal.TryParse(cleanPrice, out var parsedPrice))
                        {
                            baseRate = parsedPrice;
                        }
                        isHourly = subStr.ToLower().Contains("giờ") || subStr.ToLower().Contains("hour");
                    }
                }
            }
            else
            {
                string targetType = (vehicleType ?? "car").ToLower();
                if (targetType == "bike")
                {
                    baseRate = 10000;
                    isHourly = false;
                }
                else if (targetType == "car")
                {
                    baseRate = 20000;
                    isHourly = true;
                }
                else if (targetType == "suv")
                {
                    baseRate = 30000;
                    isHourly = true;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error calculating dynamic fee in ReportsController: " + ex.Message);
        }

        if (isHourly)
        {
            var hours = (int)Math.Max(1, Math.Ceiling(elapsedMinutes / 60.0));
            return baseRate * hours;
        }
        else
        {
            return baseRate;
        }
    }
}
