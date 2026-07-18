import { motion } from 'framer-motion';
import { CreditCard, Wallet, ArrowRight, ShieldCheck, Receipt, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

const PaymentPage = () => {
  const {
    mode,
    loading,
    selectedMethod,
    setSelectedMethod,
    loadingMethod,
    orderSummary,
    handleConfirmPayment,
  } = usePaymentFlow();

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
      name: 'MoMo Wallet',
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
                    {mode === 'checkout' ? ('Thanh toán Lối ra') : ('Thanh toán Đặt chỗ')}
                  </h1>
                  <p className="text-on-surface-variant text-sm font-medium mt-1">
                    {mode === 'checkout'
                      ? ('Vui lòng hoàn tất phí đỗ xe để mở barrier cổng ra.')
                      : ('Chọn phương thức thanh toán để hoàn tất đặt chỗ.')}
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
                      <p className="text-[11px] text-[#005BAA] font-bold mb-0.5">
                        {'Thanh toán qua VNPay'}
                      </p>
                      <p className="text-[10px] text-[#005BAA]/70 font-medium leading-relaxed">
                        {'Bạn sẽ được chuyển đến cổng thanh toán bảo mật VNPay. Hỗ trợ hơn 40 ngân hàng, ví điện tử và thẻ quốc tế.'}
                      </p>
                    </div>
                  </motion.div>
                )}
    
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                    {'Thông tin thanh toán của bạn được mã hóa 256-bit SSL. PM System không lưu trữ dữ liệu thẻ trực tiếp.'}
                  </p>
                </div>
              </div>
    
              {/* Right: Order Summary */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <Receipt className="text-primary w-5 h-5" />
                  <h2 className="text-lg font-bold text-on-surface tracking-tight">
                    {'Tóm tắt đơn hàng'}
                  </h2>
                </div>
    
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">
                      {'Vị trí đỗ'}
                    </span>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm font-black text-on-surface max-w-[200px] truncate" title={orderSummary.parkingName}>{orderSummary.parkingName}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant">Slot {orderSummary.slot}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">
                      {'Thời gian'}
                    </span>
                    <span className="text-sm font-bold text-on-surface">{orderSummary.date}, {orderSummary.time}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">
                      {'Biển số xe'}
                    </span>
                    <span className="text-sm font-bold text-on-surface">{orderSummary.plate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6">
                    <span className="text-xs font-black text-on-surface uppercase tracking-[0.2em]">
                      {'Tổng tiền'}
                    </span>
                    <span className="text-2xl font-display font-black text-primary">
                      {`${orderSummary.price.toLocaleString()} VNĐ`}
                    </span>
                  </div>
                </div>
    
                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full bg-on-surface text-surface font-bold py-4 rounded-2xl shadow-lg hover:bg-on-surface/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {loadingMethod === 'vnpay' ? ('Đang chuyển đến VNPay...') : ('Đang xử lý...')}
                    </>
                  ) : (
                    <>
                      {selectedMethod === 'vnpay' ? (
                        <>
                          <span className="flex items-center gap-0.5">
                            <span className="text-[#4fc3f7] font-black text-sm">VN</span>
                            <span className="text-[#f48fb1] font-black text-sm">PAY</span>
                          </span>
                          {'Thanh toán qua VNPay'}
                        </>
                      ) : (
                        <>{'Xác nhận thanh toán'}</>
                      )}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
    
                {selectedMethod === 'vnpay' && (
                  <p className="text-center text-[10px] text-on-surface-variant font-medium mt-3">
                    {'Bạn sẽ được chuyển hướng đến trang thanh toán VNPay an toàn'}
                  </p>
                )}
              </div>
            </motion.div>
          </main>
        </div>
  );
};

export default PaymentPage;
