using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.DTOs
{
    public class PricingConfigDto
    {
        public string Type { get; set; } = string.Empty;
        public string Price { get; set; } = "0";
        public string Sub { get; set; } = "VNĐ / Giờ";
    }
}
