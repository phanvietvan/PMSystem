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
        
        var currentMonthRevenue = currentMonthSessions.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value) : 0m));
        var lastMonthRevenue = lastMonthSessions.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value) : 0m));
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
            var dRevenue = dSessions.Sum(s => (double)CalculateFee(s.EntryTime, s.ExitTime.Value));
            
            var lastWeekDate = targetDate.AddDays(-7);
            var lastWeekSessions = sessions.Where(s => s.ExitTime.HasValue && s.ExitTime.Value.Date == lastWeekDate.Date);
            var lastWeekRevenue = lastWeekSessions.Sum(s => (double)CalculateFee(s.EntryTime, s.ExitTime.Value));

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
                id = GetZoneId(g.Key),
                name = g.Key,
                count = g.Count().ToString("N0"),
                revenueValue = g.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value) : 0m)),
                revenue = FormatRevenue(g.Sum(s => (double)(s.ExitTime.HasValue ? CalculateFee(s.EntryTime, s.ExitTime.Value) : 0m)))
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

        return Ok(new {
            summary = new {
                totalCount = totalCount,
                growth = growth > 0 ? $"+{growth:F1}%" : $"{growth:F1}%",
                occupancyRate = $"{occupancyRate:F1}%"
            },
            monthlyData = monthlyData,
            zones = zonesList
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

    private decimal CalculateFee(DateTime entry, DateTime exit)
    {
        var duration = exit - entry;
        var hours = (decimal)duration.TotalHours;
        return hours <= 1 ? 15000 : 15000 + (Math.Ceiling(hours) - 1) * 5000;
    }
}
