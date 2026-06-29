using Microsoft.Extensions.Options;
using Repositories.Configuration;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IParkingSessionRepository _sessionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRepository<ParkingLot> _lotRepository;
        private readonly IEmailService _emailService;
        private readonly VnPaySettings _vnPaySettings;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IParkingSessionRepository sessionRepository,
            IUserRepository userRepository,
            IRepository<ParkingLot> lotRepository,
            IEmailService emailService,
            IOptions<VnPaySettings> vnPayOptions)
        {
            _paymentRepository = paymentRepository;
            _sessionRepository = sessionRepository;
            _userRepository = userRepository;
            _lotRepository = lotRepository;
            _emailService = emailService;
            _vnPaySettings = vnPayOptions.Value;
        }

        public async Task<ApiResponse<IEnumerable<Payment>>> GetAllPaymentsAsync()
        {
            var payments = await _paymentRepository.GetAllAsync();

            return ApiResponse<IEnumerable<Payment>>.Ok(payments);
        }

        public async Task<ApiResponse<Payment>> GetPaymentByIdAsync(Guid id)
        {
            var payment = await _paymentRepository.GetByIdAsync(id);

            if (payment == null)
            {
                return ApiResponse<Payment>.Fail("Không tìm thấy giao dịch.");
            }

            return ApiResponse<Payment>.Ok(payment);
        }

        public async Task<ApiResponse<VnPayPaymentUrlResponse>> CreateVnPayPaymentUrlAsync(
            VnPayCreatePaymentRequest request,
            string? clientIp)
        {
            await Task.CompletedTask;

            if (request.Amount <= 0)
            {
                return ApiResponse<VnPayPaymentUrlResponse>.Fail(
                    "Số tiền thanh toán không hợp lệ.");
            }

            var now = DateTime.UtcNow.AddHours(7);

            var txnRef =
                request.OrderId ??
                $"PAY{now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";

            var amountInVnd =
                ((long)Math.Round(request.Amount)) * 100;

            var ipAddress =
                string.IsNullOrWhiteSpace(clientIp)
                    ? "127.0.0.1"
                    : clientIp;

            if (ipAddress == "::1")
            {
                ipAddress = "127.0.0.1";
            }

            var orderInfo =
                request.OrderInfo ??
                $"Thanh toan dau xe {txnRef}";

            if (orderInfo.Length > 255)
            {
                orderInfo = orderInfo.Substring(0, 255);
            }

            var requestData = new SortedDictionary<string, string>
            {
                ["vnp_Version"] = _vnPaySettings.Version,
                ["vnp_Command"] = _vnPaySettings.Command,
                ["vnp_TmnCode"] = _vnPaySettings.TmnCode,
                ["vnp_Amount"] = amountInVnd.ToString(),
                ["vnp_CurrCode"] = _vnPaySettings.CurrCode,
                ["vnp_TxnRef"] = txnRef,
                ["vnp_OrderInfo"] = orderInfo,
                ["vnp_OrderType"] = "other",
                ["vnp_Locale"] = _vnPaySettings.Locale,
                ["vnp_ReturnUrl"] = _vnPaySettings.ReturnUrl,
                ["vnp_IpAddr"] = ipAddress,
                ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
                ["vnp_ExpireDate"] = now
                    .AddMinutes(15)
                    .ToString("yyyyMMddHHmmss")
            };

            var paymentUrl = VnPayLibrary.CreatePaymentUrl(
                _vnPaySettings.BaseUrl,
                _vnPaySettings.HashSecret,
                requestData);

            return ApiResponse<VnPayPaymentUrlResponse>.Ok(
                new VnPayPaymentUrlResponse
                {
                    PaymentUrl = paymentUrl,
                    TxnRef = txnRef
                },
                "URL thanh toán VNPay đã được tạo thành công.");
        }

        public async Task<ApiResponse<VnPayCallbackResponse>> VerifyVnPayPaymentAsync(
            IEnumerable<KeyValuePair<string, string>> requestParams)
        {
            var requestList = requestParams.ToList();

            var vnpResponseCode =
                requestList.FirstOrDefault(
                    x => x.Key == "vnp_ResponseCode").Value;

            var vnpTransactionStatus =
                requestList.FirstOrDefault(
                    x => x.Key == "vnp_TransactionStatus").Value;

            var vnpTransactionNo =
                requestList.FirstOrDefault(
                    x => x.Key == "vnp_TransactionNo").Value;

            var vnpTxnRef =
                requestList.FirstOrDefault(
                    x => x.Key == "vnp_TxnRef").Value;

            var vnpAmountString =
                requestList.FirstOrDefault(
                    x => x.Key == "vnp_Amount").Value;

            long.TryParse(vnpAmountString, out var vnpAmount);

            var isValidSignature =
                VnPayLibrary.ValidateSignature(
                    requestList,
                    _vnPaySettings.HashSecret);

            if (!isValidSignature)
            {
                return ApiResponse<VnPayCallbackResponse>.Fail(
                    "Chữ ký không hợp lệ. Giao dịch có thể bị giả mạo.");
            }

            var isPaid =
                vnpResponseCode == "00" &&
                vnpTransactionStatus == "00";

            if (isPaid)
            {
                if (!string.IsNullOrWhiteSpace(vnpTxnRef))
                {
                    var existingPayment =
                        await _paymentRepository
                            .GetByTransactionIdAsync(vnpTxnRef);

                    if (existingPayment != null)
                    {
                        existingPayment.Status = "Completed";
                        existingPayment.VnPayTransactionNo =
                            vnpTransactionNo;

                        existingPayment.VnPayResponseCode =
                            vnpResponseCode;

                        existingPayment.TransactionTime =
                            DateTime.UtcNow;

                        await _paymentRepository
                            .UpdateAsync(existingPayment);

                        await _paymentRepository
                            .SaveChangesAsync();
                    }
                    else
                    {
                        var payment = new Payment
                        {
                            Id = Guid.NewGuid(),
                            SessionId = Guid.Empty,
                            LicensePlate = string.Empty,
                            Amount = vnpAmount / 100m,
                            PaymentMethod = "VNPay",
                            Status = "Completed",
                            TransactionId = vnpTxnRef,
                            VnPayTransactionNo = vnpTransactionNo,
                            VnPayResponseCode = vnpResponseCode,
                            TransactionTime = DateTime.UtcNow
                        };

                        await _paymentRepository
                            .AddAsync(payment);

                        await _paymentRepository
                            .SaveChangesAsync();
                    }

                    // Cập nhật ParkingSession tương ứng và gửi email!
                    var qrCode = vnpTxnRef.Replace("PAY-", "");
                    var session = await _sessionRepository.FirstOrDefaultAsync(ps => ps.QrCode == qrCode);

                    if (session != null)
                    {
                        // Cập nhật session status thành Active nếu nó đang là PendingPayment
                        if (session.Status == "PendingPayment")
                        {
                            session.Status = "Active";
                            session.UpdatedAt = DateTime.UtcNow;
                            _sessionRepository.Update(session);
                            await _sessionRepository.SaveChangesAsync();

                            // Gửi email xác nhận đặt chỗ ở đây!
                            User? user = null;
                            if (session.UserId.HasValue)
                            {
                                user = await _userRepository.GetByIdAsync(session.UserId.Value);
                            }

                            if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                            {
                                var userName = !string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName)
                                    ? $"{user.FirstName} {user.LastName}".Trim()
                                    : (user.Username ?? "Khách hàng");

                                string mapsLink = "";
                                var parkingLot = await _lotRepository.FirstOrDefaultAsync(l => l.Name == session.ParkingLotName);
                                if (parkingLot != null && !string.IsNullOrWhiteSpace(parkingLot.Latitude) && !string.IsNullOrWhiteSpace(parkingLot.Longitude))
                                {
                                    mapsLink = $"https://www.google.com/maps?q={parkingLot.Latitude},{parkingLot.Longitude}";
                                }

                                _ = _emailService.SendBookingConfirmationEmailAsync(
                                    user.Email,
                                    userName,
                                    session.QrCode,
                                    session.ParkingLotName ?? "PM System Central",
                                    session.ParkingSlot ?? "Tự động phân bổ",
                                    session.LicensePlate.ToUpper(),
                                    mapsLink,
                                    session.ReservationDate,
                                    session.ReservationStartTime,
                                    session.ReservationEndTime
                                );
                            }
                        }

                        // Đồng thời gán SessionId và LicensePlate cho payment record
                        var savedPayment = await _paymentRepository.GetByTransactionIdAsync(vnpTxnRef);
                        if (savedPayment != null)
                        {
                            savedPayment.SessionId = session.Id;
                            savedPayment.LicensePlate = session.LicensePlate;
                            if (session.UserId.HasValue)
                            {
                                savedPayment.UserId = session.UserId.Value;
                            }
                            await _paymentRepository.UpdateAsync(savedPayment);
                            await _paymentRepository.SaveChangesAsync();
                        }
                    }
                }

                return ApiResponse<VnPayCallbackResponse>.Ok(
                    new VnPayCallbackResponse
                    {
                        IsPaid = true,
                        TransactionNo = vnpTransactionNo,
                        TxnRef = vnpTxnRef,
                        Amount = vnpAmount / 100m,
                        ResponseCode = vnpResponseCode,
                        Message = "Thanh toán VNPay thành công."
                    });
            }

            return ApiResponse<VnPayCallbackResponse>.Ok(
                new VnPayCallbackResponse
                {
                    IsPaid = false,
                    TransactionNo = vnpTransactionNo,
                    TxnRef = vnpTxnRef,
                    Amount = vnpAmount / 100m,
                    ResponseCode = vnpResponseCode,
                    Message = GetVnPayErrorMessage(vnpResponseCode)
                });
        }

        private static string GetVnPayErrorMessage(string? code)
        {
            return code switch
            {
                "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ.",
                "09" => "Tài khoản chưa đăng ký Internet Banking.",
                "10" => "Xác thực thông tin không đúng quá 3 lần.",
                "11" => "Đã hết hạn chờ thanh toán.",
                "12" => "Tài khoản bị khóa.",
                "13" => "Sai OTP.",
                "24" => "Khách hàng hủy giao dịch.",
                "51" => "Tài khoản không đủ số dư.",
                "65" => "Vượt hạn mức giao dịch trong ngày.",
                "75" => "Ngân hàng bảo trì.",
                "79" => "Sai mật khẩu thanh toán.",
                "99" => "Lỗi không xác định.",
                _ => "Giao dịch không thành công."
            };
        }
    }
}
