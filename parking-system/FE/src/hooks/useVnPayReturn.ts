import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../services/payment.service';

export interface VnPayResult {
  success: boolean;
  isPaid: boolean;
  vnpResponseCode?: string;
  vnpTransactionNo?: string;
  amount?: number;
  txnRef?: string;
  message?: string;
}

export function useVnPayReturn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [result, setResult] = useState<VnPayResult | null>(null);
  const [errorDetail, setErrorDetail] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await paymentService.verifyVnPayReturn(location.search);
        const data = response.data as VnPayResult;
        setResult(data);

        if (data.isPaid) {
          setStatus('success');
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
            'Không thể xác minh kết quả thanh toán. Vui lòng liên hệ hỗ trợ.',
        );
      }
    };

    void verifyPayment();
  }, [location.search, navigate]);

  return { status, result, errorDetail, navigate };
}
