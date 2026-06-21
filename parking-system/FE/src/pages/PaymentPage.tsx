import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, Apple, ArrowRight, ShieldCheck, Receipt } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { parseLicensePlate, getActiveQrs, addActiveQr, removeActiveQr } from '../utils/auth';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'reserve';

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';
  const [licensePlate, setLicensePlate] = useState('51F-123.45');
  const [price, setPrice] = useState(50000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sync user plate if logged in
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

    if (mode === 'checkout') {
      const fetchCheckoutFee = async () => {
        const sessionQrs = getActiveQrs();
        const sessionQr = sessionQrs.length > 0 ? sessionQrs[sessionQrs.length - 1] : null;
        if (sessionQr) {
          try {
            const response = await api.get(`/ParkingSessions/verify/${sessionQr}`);
            if (response.data && response.data.fee !== undefined) {
              setPrice(response.data.fee);
            } else {
              setPrice(10000);
            }
          } catch (e) {
            console.error('Error fetching checkout fee from server', e);
            setPrice(15000); // fallback
          }
        } else {
          setPrice(10000);
        }
      };
      fetchCheckoutFee();
    } else {
      setPrice(50000); // reservation standard flat rate
    }
  }, [mode]);

  const handleConfirmPayment = async () => {
    setLoading(true);
    let qrCode = '';
    if (mode === 'checkout') {
      const sessionQrs = getActiveQrs();
      const sessionQr = sessionQrs.length > 0 ? sessionQrs[sessionQrs.length - 1] : null;
      if (sessionQr) {
        qrCode = sessionQr;
        try {
          // Perform backend checkout
          await api.post('/ParkingSessions/checkout', {
            qrCode: sessionQr,
            exitLicensePlate: licensePlate,
            exitPhoto: ''
          });
          // Remove from local storage upon successful database checkout completion
          removeActiveQr(sessionQr);
        } catch (e) {
          console.error('Checkout post error on backend', e);
        }
      }
    } else {
      // For reservation mode: checkin a new active session in the database!
      try {
        const storedParking = localStorage.getItem('selectedParking');
        let parkingLotName = 'Landmark 81 - Bãi đỗ A1';
        if (storedParking) {
          try {
            parkingLotName = JSON.parse(storedParking).name;
          } catch (e) {}
        }
        const reservationDate = localStorage.getItem('reservationDate') || '';
        const reservationStartTime = localStorage.getItem('reservationStartTime') || '';
        const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
        const reservationLicensePlate = parseLicensePlate(localStorage.getItem('reservationLicensePlate') || licensePlate);
        const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';

        const storedUser = localStorage.getItem('user');
        let loggedInUserId = null;
        if (storedUser) {
          try {
            loggedInUserId = JSON.parse(storedUser).id;
          } catch (e) {}
        }

        const response = await api.post('/ParkingSessions/checkin', {
          licensePlate: reservationLicensePlate,
          entryPhoto: '',
          parkingLotName: parkingLotName,
          vehicleType: reservationVehicleType,
          reservationDate: reservationDate,
          reservationStartTime: reservationStartTime,
          parkingSlot: selectedSlot,
          userId: loggedInUserId
        });
        if (response.data && response.data.qrCode) {
          qrCode = response.data.qrCode;
          addActiveQr(response.data.qrCode);
        }
        localStorage.removeItem('reservationDate');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('reservationVehicleType');
        localStorage.removeItem('reservationLicensePlate');
      } catch (e) {
        console.error('Error creating database active session on reservation', e);
      }
    }
    setLoading(false);
    navigate('/success', { state: { mode, qrCode } });
  };

  let parkingInfo = { name: "Landmark 81 - Bãi đỗ A1", floor: "Tầng 1", block: "Block A" };
  try {
    const raw = localStorage.getItem('selectedParking');
    if (raw) parkingInfo = JSON.parse(raw);
  } catch(e) {}

  const orderSummary = {
    date: localStorage.getItem('reservationDate') ? new Date(localStorage.getItem('reservationDate')!).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
    time: localStorage.getItem('reservationStartTime') || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    slot: selectedSlot,
    parkingName: parkingInfo.name,
    plate: licensePlate,
    price: price
  };

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
            <h1 className="text-3xl font-display font-bold text-on-surface">
              {mode === 'checkout' ? 'Thanh toán Lối ra' : 'Thanh toán Đặt chỗ'}
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">
              {mode === 'checkout' 
                ? 'Vui lòng hoàn tất phí đỗ xe để mở barrier cổng ra.' 
                : 'Chọn phương thức thanh toán để hoàn tất đăng ký đặt chỗ.'}
            </p>

            <div className="space-y-3">
              {[
                { id: 'visa', name: 'Thẻ Credit / Debit', icon: <CreditCard className="w-5 h-5" />, desc: 'Visa, Mastercard, JCB' },
                { id: 'momo', name: 'Ví MoMo', icon: <Wallet className="w-5 h-5 text-pink-500" />, desc: 'Thanh toán nhanh qua ứng dụng' },
                { id: 'apple', name: 'Apple Pay', icon: <Apple className="w-5 h-5" />, desc: 'Bảo mật tuyệt đối' },
              ].map((method) => (
                <button 
                  key={method.id}
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:border-primary hover:shadow-lg transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {method.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-on-surface">{method.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{method.desc}</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-outline-variant group-hover:border-primary"></div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
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
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentPage;
