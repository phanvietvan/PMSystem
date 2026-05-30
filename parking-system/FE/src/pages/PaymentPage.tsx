import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, ArrowRight, ShieldCheck, Receipt, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { parseLicensePlate, getActiveQrs, addActiveQr, removeActiveQr } from '../utils/auth';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'reserve';

  const [licensePlate, setLicensePlate] = useState(() => {
    const reservationPlate = localStorage.getItem('reservationLicensePlate');
    return reservationPlate ? parseLicensePlate(reservationPlate) : '51F-123.45';
  });
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [price, setPrice] = useState(50000);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('vnpay');
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('reservationLicensePlate')) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.licensePlate) {
            setLicensePlate(parseLicensePlate(user.licensePlate));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (mode === 'checkout') {
      const fetchCheckoutFee = async () => {
        const sessionQrs = getActiveQrs();
        const sessionQr = sessionQrs.length > 0 ? sessionQrs[sessionQrs.length - 1] : null;
        if (sessionQr) {
          try {
            const response = await api.get(`/ParkingSessions/verify/${sessionQr}`);
            if (response.data && response.data.fee !== undefined) {
              setPrice(response.data.fee);
              if (response.data.session) {
                setCheckoutSession(response.data.session);
                const sPlate = response.data.session.licensePlate || response.data.session.LicensePlate;
                if (sPlate) setLicensePlate(sPlate);
              }
            } else {
              setPrice(10000);
            }
          } catch (e) {
            console.error('Error fetching checkout fee from server', e);
            setPrice(15000);
          }
        } else {
          setPrice(10000);
        }
      };
      fetchCheckoutFee();
    } else {
      const loadReservationPrice = async () => {
        let basePrice = 50000;
        try {
          const response = await api.get('/ParkingSessions/pricing');
          if (response.data && Array.isArray(response.data)) {
            localStorage.setItem('parking_pricing', JSON.stringify(response.data));
            const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
            let matched = null;
            if (reservationVehicleType === 'bike') matched = response.data[0];
            else if (reservationVehicleType === 'car') matched = response.data[1];
            else if (reservationVehicleType === 'suv') matched = response.data[2];
            if (matched) {
              const cleanPriceStr = matched.price.replace(/[.,]/g, '');
              const parsedNum = parseFloat(cleanPriceStr);
              if (!isNaN(parsedNum)) basePrice = parsedNum;
            }
          }
        } catch (e) {
          const savedPricing = localStorage.getItem('parking_pricing');
          if (savedPricing) {
            try {
              const parsed = JSON.parse(savedPricing);
              const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
              let matched = null;
              if (reservationVehicleType === 'bike') matched = parsed[0];
              else if (reservationVehicleType === 'car') matched = parsed[1];
              else if (reservationVehicleType === 'suv') matched = parsed[2];
              if (matched) {
                const cleanPriceStr = matched.price.replace(/[.,]/g, '');
                const parsedNum = parseFloat(cleanPriceStr);
                if (!isNaN(parsedNum)) basePrice = parsedNum;
              }
            } catch (err) {}
          }
        }
        setPrice(basePrice);
      };
      loadReservationPrice();
    }
  }, [mode]);

  // ── Xử lý thanh toán qua VNPay ──────────────────────────────────────────────
  const handleVnPayPayment = async () => {
    setLoading(true);
    setLoadingMethod('vnpay');
    let qrCode = '';

    try {
      if (mode === 'checkout') {
        // Checkout: thực hiện checkout backend trước
        const sessionQrs = getActiveQrs();
        const sessionQr = sessionQrs.length > 0 ? sessionQrs[sessionQrs.length - 1] : null;
        if (sessionQr) {
          qrCode = sessionQr;
          try {
            await api.post('/ParkingSessions/checkout', {
              qrCode: sessionQr,
              exitLicensePlate: licensePlate,
              exitPhoto: ''
            });
            removeActiveQr(sessionQr);
          } catch (e) {
            console.error('Checkout post error on backend', e);
          }
        }
      } else {
        // Reserve: tạo session checkin trong DB
        const storedParking = localStorage.getItem('selectedParking');
        let parkingLotName = 'Landmark 81 - Bãi đỗ A1';
        if (storedParking) {
          try { parkingLotName = JSON.parse(storedParking).name; } catch (e) {}
        }
        const reservationDate = localStorage.getItem('reservationDate') || '';
        const reservationStartTime = localStorage.getItem('reservationStartTime') || '';
        const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
        const reservationLicensePlate = parseLicensePlate(localStorage.getItem('reservationLicensePlate') || licensePlate);
        const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';

        const storedUser = localStorage.getItem('user');
        let loggedInUserId = null;
        if (storedUser) {
          try { loggedInUserId = JSON.parse(storedUser).id; } catch (e) {}
        }

        const response = await api.post('/ParkingSessions/checkin', {
          licensePlate: reservationLicensePlate,
          entryPhoto: '',
          parkingLotName,
          vehicleType: reservationVehicleType,
          reservationDate,
          reservationStartTime,
          parkingSlot: selectedSlot,
          userId: loggedInUserId,
          prepaidAmount: 0 // Chưa thanh toán, sẽ xác nhận sau khi VNPay trả về
        });

        if (response.data && response.data.qrCode) {
          qrCode = response.data.qrCode;
          addActiveQr(response.data.qrCode);
          // Lưu QR code để VnPayReturnPage dùng sau khi xác nhận
          localStorage.setItem('pendingVnPayQrCode', response.data.qrCode);
        }

        localStorage.removeItem('reservationDate');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('reservationVehicleType');
        localStorage.removeItem('reservationLicensePlate');
      }

      // Gọi BE tạo URL VNPay
      const parkingLotName = (() => {
        try { return JSON.parse(localStorage.getItem('selectedParking') || '{}').name || 'PM System Parking'; }
        catch { return 'PM System Parking'; }
      })();

      const vnpayResponse = await api.post('/Payments/vnpay/create-payment-url', {
        amount: price,
        orderInfo: `Thanh toan dau xe ${parkingLotName} - ${licensePlate}`.substring(0, 255),
        orderId: qrCode ? `PAY-${qrCode.substring(0, 12)}` : undefined
      });

      const paymentUrl = vnpayResponse.data?.paymentUrl;
      if (paymentUrl) {
        // Redirect sang VNPay
        window.location.href = paymentUrl;
      } else {
        throw new Error('Không nhận được URL thanh toán từ VNPay.');
      }
    } catch (e: any) {
      console.error('VNPay payment error:', e);
      const errMsg = e.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch VNPay. Vui lòng thử lại.';
      alert(errMsg);
      setLoading(false);
      setLoadingMethod(null);
    }
  };

  // ── Xử lý phương thức thanh toán khác (mock) ────────────────────────────────
  const handleMockPayment = async () => {
    setLoading(true);
    setLoadingMethod('mock');
    let qrCode = '';

    if (mode === 'checkout') {
      const sessionQrs = getActiveQrs();
      const sessionQr = sessionQrs.length > 0 ? sessionQrs[sessionQrs.length - 1] : null;
      if (sessionQr) {
        qrCode = sessionQr;
        try {
          await api.post('/ParkingSessions/checkout', {
            qrCode: sessionQr,
            exitLicensePlate: licensePlate,
            exitPhoto: ''
          });
          removeActiveQr(sessionQr);
        } catch (e) {
          console.error('Checkout post error on backend', e);
        }
      }
    } else {
      try {
        const storedParking = localStorage.getItem('selectedParking');
        let parkingLotName = 'Landmark 81 - Bãi đỗ A1';
        if (storedParking) {
          try { parkingLotName = JSON.parse(storedParking).name; } catch (e) {}
        }
        const reservationDate = localStorage.getItem('reservationDate') || '';
        const reservationStartTime = localStorage.getItem('reservationStartTime') || '';
        const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
        const reservationLicensePlate = parseLicensePlate(localStorage.getItem('reservationLicensePlate') || licensePlate);
        const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';

        const storedUser = localStorage.getItem('user');
        let loggedInUserId = null;
        if (storedUser) {
          try { loggedInUserId = JSON.parse(storedUser).id; } catch (e) {}
        }

        const response = await api.post('/ParkingSessions/checkin', {
          licensePlate: reservationLicensePlate,
          entryPhoto: '',
          parkingLotName,
          vehicleType: reservationVehicleType,
          reservationDate,
          reservationStartTime,
          parkingSlot: selectedSlot,
          userId: loggedInUserId,
          prepaidAmount: price
        });
        if (response.data && response.data.qrCode) {
          qrCode = response.data.qrCode;
          addActiveQr(response.data.qrCode);
        }
        localStorage.removeItem('reservationDate');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('reservationVehicleType');
        localStorage.removeItem('reservationLicensePlate');
      } catch (e: any) {
        console.error('Error creating database active session on reservation', e);
        const errMsg = e.response?.data?.message || 'Vị trí này hiện đã bị khóa hoặc đang bận. Vui lòng chọn vị trí khác!';
        alert(errMsg);
        setLoading(false);
        setLoadingMethod(null);
        return;
      }
    }
    setLoading(false);
    setLoadingMethod(null);
    navigate('/success', { state: { mode, qrCode } });
  };

  const handleConfirmPayment = () => {
    if (selectedMethod === 'vnpay') {
      handleVnPayPayment();
    } else {
      handleMockPayment();
    }
  };

  let parkingInfo = { name: "Landmark 81 - Bãi đỗ A1", floor: "Tầng 1", block: "Block A" };
  try {
    const raw = localStorage.getItem('selectedParking');
    if (raw) parkingInfo = JSON.parse(raw);
  } catch(e) {}

  const orderSummary = {
    date: mode === 'checkout' && checkoutSession
      ? new Date(checkoutSession.entryTime || checkoutSession.EntryTime).toLocaleDateString('vi-VN')
      : (localStorage.getItem('reservationDate') ? new Date(localStorage.getItem('reservationDate')!).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')),
    time: mode === 'checkout' && checkoutSession
      ? new Date(checkoutSession.entryTime || checkoutSession.EntryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : (localStorage.getItem('reservationStartTime') || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })),
    slot: mode === 'checkout' && checkoutSession
      ? (checkoutSession.parkingSlot || checkoutSession.ParkingSlot)
      : (localStorage.getItem('selectedSlot') || 'A3'),
    parkingName: mode === 'checkout' && checkoutSession
      ? (checkoutSession.parkingLotName || checkoutSession.ParkingLotName)
      : parkingInfo.name,
    plate: mode === 'checkout' && checkoutSession
      ? (checkoutSession.licensePlate || checkoutSession.LicensePlate)
      : licensePlate,
    price
  };

  const paymentMethods = [
    {
      id: 'vnpay',
      name: 'VNPay',
      desc: 'ATM, Visa, Mastercard, QR Code, Internet Banking',
      icon: (
        <div className="flex items-center gap-0.5">
          <span className="text-[#005BAA] font-black text-sm leading-none">VN</span>
          <span className="text-[#E31837] font-black text-sm leading-none">PAY</span>
        </div>
      ),
      badge: 'Khuyến nghị',
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      desc: 'Thanh toán nhanh qua ứng dụng (Demo)',
      icon: <Wallet className="w-5 h-5 text-pink-500" />,
      badge: null,
    },
    {
      id: 'visa',
      name: 'Thẻ Credit / Debit',
      desc: 'Visa, Mastercard, JCB (Demo)',
      icon: <CreditCard className="w-5 h-5" />,
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Left: Payment Methods */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-on-surface">
                {mode === 'checkout' ? 'Thanh toán Lối ra' : 'Thanh toán Đặt chỗ'}
              </h1>
              <p className="text-on-surface-variant text-sm font-medium mt-1">
                {mode === 'checkout'
                  ? 'Vui lòng hoàn tất phí đỗ xe để mở barrier cổng ra.'
                  : 'Chọn phương thức thanh toán để hoàn tất đặt chỗ.'}
              </p>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between p-5 border rounded-2xl transition-all group disabled:opacity-50 ${
                    selectedMethod === method.id
                      ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      selectedMethod === method.id
                        ? 'bg-primary/10'
                        : 'bg-surface-container group-hover:bg-primary/10'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-on-surface">{method.name}</p>
                        {method.badge && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-primary text-on-primary rounded-full">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-medium">{method.desc}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                    selectedMethod === method.id ? 'border-primary bg-primary' : 'border-outline-variant'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* VNPay Info Banner */}
            {selectedMethod === 'vnpay' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#005BAA]/5 rounded-xl border border-[#005BAA]/20 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-[#005BAA] font-black text-[10px]">VN</span>
                </div>
                <div>
                  <p className="text-[11px] text-[#005BAA] font-bold mb-0.5">Thanh toán qua VNPay</p>
                  <p className="text-[10px] text-[#005BAA]/70 font-medium leading-relaxed">
                    Bạn sẽ được chuyển đến cổng thanh toán bảo mật VNPay. Hỗ trợ hơn 40 ngân hàng, ví điện tử và thẻ quốc tế.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                Thông tin thanh toán của bạn được mã hóa 256-bit SSL. PM System không lưu trữ dữ liệu thẻ trực tiếp.
              </p>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Receipt className="text-primary w-5 h-5" />
              <h2 className="text-lg font-bold text-on-surface tracking-tight">Tóm tắt đơn hàng</h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">Vị trí đỗ</span>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-black text-on-surface max-w-[200px] truncate" title={orderSummary.parkingName}>{orderSummary.parkingName}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">Slot {orderSummary.slot}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">Thời gian</span>
                <span className="text-sm font-bold text-on-surface">{orderSummary.date}, {orderSummary.time}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">Biển số xe</span>
                <span className="text-sm font-bold text-on-surface">{orderSummary.plate}</span>
              </div>
              <div className="flex justify-between items-center pt-6">
                <span className="text-xs font-black text-on-surface uppercase tracking-[0.2em]">Tổng tiền</span>
                <span className="text-2xl font-display font-black text-primary">{orderSummary.price.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full bg-on-surface text-surface font-bold py-4 rounded-2xl shadow-lg hover:bg-on-surface/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingMethod === 'vnpay' ? 'Đang chuyển đến VNPay...' : 'Đang xử lý...'}
                </>
              ) : (
                <>
                  {selectedMethod === 'vnpay' ? (
                    <>
                      <span className="flex items-center gap-0.5">
                        <span className="text-[#4fc3f7] font-black text-sm">VN</span>
                        <span className="text-[#f48fb1] font-black text-sm">PAY</span>
                      </span>
                      Thanh toán qua VNPay
                    </>
                  ) : (
                    <>Xác nhận thanh toán</>
                  )}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {selectedMethod === 'vnpay' && (
              <p className="text-center text-[10px] text-on-surface-variant font-medium mt-3">
                Bạn sẽ được chuyển hướng đến trang thanh toán VNPay an toàn
              </p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentPage;
