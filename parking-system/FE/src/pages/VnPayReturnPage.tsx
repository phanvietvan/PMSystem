import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

interface VnPayResult {
  success: boolean;
  isPaid: boolean;
  vnpResponseCode?: string;
  vnpTransactionNo?: string;
  amount?: number;
  txnRef?: string;
  message?: string;
}

const VnPayReturnPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [result, setResult] = useState<VnPayResult | null>(null);
  const [errorDetail, setErrorDetail] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy toàn bộ query string từ VNPay trả về
        const queryString = location.search; // ví dụ: ?vnp_ResponseCode=00&...
        
        // Gọi BE để verify chữ ký HMAC
        const response = await api.get(`/Payments/vnpay/verify${queryString}`);
        const data = response.data as VnPayResult;

        setResult(data);

        if (data.isPaid) {
          setStatus('success');
          // Chuyển tới trang success sau 2 giây
          setTimeout(() => {
            navigate('/success', {
              state: {
                mode: 'reserve',
                qrCode: localStorage.getItem('pendingVnPayQrCode') || '',
                fromVnPay: true,
              },
            });
          }, 2500);
        } else {
          setStatus('failed');
          setErrorDetail(data.message || 'Giao dịch không thành công.');
        }
      } catch (err: any) {
        console.error('VNPay verify error:', err);
        setStatus('failed');
        setErrorDetail(
          err?.response?.data?.message ||
          'Không thể xác minh kết quả thanh toán. Vui lòng liên hệ hỗ trợ.'
        );
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-mesh-gradient selection:bg-primary/10 relative">
      <Navbar />

      <main className="max-w-lg mx-auto px-6 pt-32 pb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-[3rem] p-10 shadow-2xl shadow-primary/5 text-center"
        >
          {/* ── Loading ─────────────────────────────────────── */}
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 py-8"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-on-surface mb-2">
                  Đang xác minh giao dịch...
                </h1>
                <p className="text-on-surface-variant text-sm">
                  Hệ thống đang kiểm tra kết quả từ VNPay. Vui lòng không đóng trang.
                </p>
              </div>

              {/* VNPay Logo Placeholder */}
              <div className="flex items-center gap-2 px-5 py-2 bg-[#005BAA]/5 rounded-full border border-[#005BAA]/20">
                <span className="text-[#005BAA] font-black text-sm tracking-tight">VN</span>
                <span className="text-[#E31837] font-black text-sm tracking-tight">PAY</span>
              </div>
            </motion.div>
          )}

          {/* ── Success ─────────────────────────────────────── */}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h1 className="text-2xl font-display font-bold text-on-surface mb-2">
                  Thanh toán thành công! 🎉
                </h1>
                <p className="text-on-surface-variant text-sm">
                  VNPay đã xác nhận giao dịch của bạn. Đang chuyển hướng...
                </p>
              </div>

              {result && (
                <div className="w-full space-y-3 bg-surface-container rounded-2xl p-5 text-left">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Số tiền</span>
                    <span className="font-black text-emerald-600">
                      {result.amount?.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Mã giao dịch VNPay</span>
                    <span className="font-mono text-xs font-bold text-on-surface">
                      {result.vnpTransactionNo || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Mã đơn hàng</span>
                    <span className="font-mono text-xs font-bold text-on-surface">
                      {result.txnRef || '—'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span className="text-xs text-on-surface-variant font-medium">
                  Đang chuyển hướng tới trang xác nhận...
                </span>
              </div>
            </motion.div>
          )}

          {/* ── Failed ──────────────────────────────────────── */}
          {status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <XCircle className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h1 className="text-2xl font-display font-bold text-on-surface mb-2">
                  Thanh toán thất bại
                </h1>
                <p className="text-red-500 text-sm font-medium">
                  {errorDetail || 'Giao dịch không được xác nhận từ VNPay.'}
                </p>
              </div>

              {result?.vnpResponseCode && (
                <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 text-left">
                  <p className="text-xs text-red-600 font-medium">
                    <span className="font-black">Mã lỗi VNPay (vnp_ResponseCode):</span> {result.vnpResponseCode}
                  </p>
                  <p className="text-xs text-red-500 mt-1">{result.message}</p>
                </div>
              )}

              {/* Debug: hiển thị vnp_ResponseCode từ URL nếu result chưa có */}
              {!result?.vnpResponseCode && (() => {
                const params = new URLSearchParams(location.search);
                const code = params.get('vnp_ResponseCode');
                const status = params.get('vnp_TransactionStatus');
                return code ? (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                    <p className="text-xs text-amber-700 font-black mb-1">Thông tin từ VNPay:</p>
                    <p className="text-xs text-amber-600 font-medium">ResponseCode: <span className="font-mono font-black">{code}</span></p>
                    <p className="text-xs text-amber-600 font-medium">TransactionStatus: <span className="font-mono font-black">{status}</span></p>
                  </div>
                ) : null;
              })()}


              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => navigate('/payment')}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/10 hover:scale-[1.02] transition-transform"
                >
                  <RotateCcw className="w-4 h-4" />
                  Thử lại thanh toán
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high font-bold py-4 rounded-2xl transition-all text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Về trang chủ
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default VnPayReturnPage;
