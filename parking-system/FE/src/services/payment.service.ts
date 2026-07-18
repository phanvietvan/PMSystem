import api from '../utils/api';

export const paymentService = {
  createVnPayPaymentUrl: (body: unknown) =>
    api.post('/Payments/vnpay/create-payment-url', body),

  /** queryString must include leading `?` when present */
  verifyVnPayReturn: (queryString: string) =>
    api.get(`/Payments/vnpay/verify${queryString}`),
};
