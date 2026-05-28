using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.DTOs
{
    public class CreatePayOSPaymentRequest
    {
        public Guid SessionId { get; set; }

        public string ReturnUrl { get; set; }
            = string.Empty;

        public string CancelUrl { get; set; }
            = string.Empty;
    }

}
