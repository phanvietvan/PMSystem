import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseLicensePlate, getActiveQrs, addActiveQr, removeActiveQr } from '../utils/auth';
import { parkingService } from '../services/parking.service';
import { paymentService } from '../services/payment.service';
import { usePricing } from './usePricing';

export function usePaymentFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'reserve';
  const { fetchPricing } = usePricing({ autoFetch: false });

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
            const response = await parkingService.verifySession(sessionQr);
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
      void fetchCheckoutFee();
    } else {
      const loadReservationPrice = async () => {
        let basePrice = 50000;
        try {
          const pricing = await fetchPricing();
          const data = pricing || JSON.parse(localStorage.getItem('parking_pricing') || 'null');
          if (data && Array.isArray(data)) {
            const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
            let matched = null;
            if (reservationVehicleType === 'bike') matched = data[0];
            else if (reservationVehicleType === 'car') matched = data[1];
            else if (reservationVehicleType === 'suv') matched = data[2];
            if (matched) {
              const cleanPriceStr = matched.price.replace(/[.,]/g, '');
              const parsedNum = parseFloat(cleanPriceStr);
              if (!isNaN(parsedNum)) basePrice = parsedNum;
            }
          }
        } catch {
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
            } catch {
              /* ignore */
            }
          }
        }
        setPrice(basePrice);
      };
      void loadReservationPrice();
    }
  }, [mode, fetchPricing]);

  const handleVnPayPayment = async () => {
    setLoading(true);
    setLoadingMethod('vnpay');
    let qrCode = '';

    try {
      if (mode === 'checkout') {
        const sessionQrs = getActiveQrs();
        const sessionQr = sessionQrs.length > 0 ? sessionQrs[sessionQrs.length - 1] : null;
        if (sessionQr) {
          qrCode = sessionQr;
          try {
            await parkingService.checkout({
              qrCode: sessionQr,
              exitLicensePlate: licensePlate,
              exitPhoto: '',
            });
            removeActiveQr(sessionQr);
          } catch (e) {
            console.error('Checkout post error on backend', e);
          }
        }
      } else {
        const storedParking = localStorage.getItem('selectedParking');
        let parkingLotName = 'Landmark 81 - Bãi đỗ A1';
        // Only send parkingLotId if it is a valid Guid string (from the real API).
        // DEFAULT_LOTS uses integer IDs (1, 2, 3...) which are incompatible with the
        // SQL Server uniqueidentifier column ParkingLotId added in 3NF normalization.
        let parkingLotId: string | null = null;
        if (storedParking) {
          try {
            const parsed = JSON.parse(storedParking);
            parkingLotName = parsed.name;
            const rawId = parsed.id;
            const isValidGuid =
              typeof rawId === 'string' &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
            parkingLotId = isValidGuid ? rawId : null;
          } catch {
            /* ignore */
          }
        }
        const reservationDate = localStorage.getItem('reservationDate') || '';
        const reservationEndDate =
          localStorage.getItem('reservationEndDate') || reservationDate;
        const reservationStartTime = localStorage.getItem('reservationStartTime') || '';
        const reservationEndTime = localStorage.getItem('reservationEndTime') || '';
        const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
        const reservationLicensePlate = parseLicensePlate(
          localStorage.getItem('reservationLicensePlate') || licensePlate,
        );
        const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';

        if (!reservationLicensePlate?.trim()) {
          throw new Error('Thiếu biển số xe. Vui lòng cập nhật hồ sơ hoặc chọn xe trước khi thanh toán.');
        }
        if (reservationDate && (!reservationStartTime || !reservationEndTime)) {
          throw new Error('Thiếu khung giờ đặt chỗ. Vui lòng chọn lại thời gian trên trang Reservation.');
        }

        const storedUser = localStorage.getItem('user');
        let loggedInUserId = null;
        if (storedUser) {
          try {
            loggedInUserId = JSON.parse(storedUser).id;
          } catch {
            /* ignore */
          }
        }

        const response = await parkingService.checkin({
          licensePlate: reservationLicensePlate,
          entryPhoto: '',
          parkingLotName,
          parkingLotId,
          vehicleType: reservationVehicleType,
          reservationDate: reservationDate || null,
          reservationEndDate: reservationDate ? reservationEndDate || reservationDate : null,
          reservationStartTime: reservationDate ? reservationStartTime : null,
          reservationEndTime: reservationDate ? reservationEndTime : null,
          parkingSlot: selectedSlot,
          userId: loggedInUserId,
          prepaidAmount: 0,
        });

        if (response.data && response.data.qrCode) {
          qrCode = response.data.qrCode;
          addActiveQr(response.data.qrCode);
          localStorage.setItem('pendingVnPayQrCode', response.data.qrCode);
        }

        localStorage.removeItem('reservationDate');
        localStorage.removeItem('reservationEndDate');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('reservationEndTime');
        localStorage.removeItem('reservationVehicleType');
        localStorage.removeItem('reservationLicensePlate');
      }

      const parkingLotName = (() => {
        try {
          return JSON.parse(localStorage.getItem('selectedParking') || '{}').name || 'Bãi đỗ PM System';
        } catch {
          return 'Bãi đỗ PM System';
        }
      })();

      const orderInfoStr = `Thanh toan dau xe ${parkingLotName} - ${licensePlate}`;

      const vnpayResponse = await paymentService.createVnPayPaymentUrl({
        amount: price,
        orderInfo: orderInfoStr.substring(0, 255),
        orderId: qrCode ? `PAY-${qrCode}` : undefined,
      });

      const paymentUrl = vnpayResponse.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('Không nhận được URL thanh toán từ VNPay.');
      }
    } catch (e: any) {
      console.error('VNPay payment error:', e);
      const defaultErr = 'Có lỗi xảy ra khi tạo giao dịch VNPay. Vui lòng thử lại.';
      const data = e.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join(' ')
        : '';
      const errMsg =
        e.message?.startsWith('Thiếu')
          ? e.message
          : data?.message || data?.title || validationErrors || defaultErr;
      alert(errMsg);
      setLoading(false);
      setLoadingMethod(null);
    }
  };

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
          await parkingService.checkout({
            qrCode: sessionQr,
            exitLicensePlate: licensePlate,
            exitPhoto: '',
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
        // Same Guid guard as VNPay path — numeric DEFAULT_LOTS ids break model binding.
        let parkingLotId: string | null = null;
        if (storedParking) {
          try {
            const parsed = JSON.parse(storedParking);
            parkingLotName = parsed.name;
            const rawId = parsed.id;
            const isValidGuid =
              typeof rawId === 'string' &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
            parkingLotId = isValidGuid ? rawId : null;
          } catch {
            /* ignore */
          }
        }
        const reservationDate = localStorage.getItem('reservationDate') || '';
        const reservationEndDate =
          localStorage.getItem('reservationEndDate') || reservationDate;
        const reservationStartTime = localStorage.getItem('reservationStartTime') || '';
        const reservationEndTime = localStorage.getItem('reservationEndTime') || '';
        const reservationVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
        const reservationLicensePlate = parseLicensePlate(
          localStorage.getItem('reservationLicensePlate') || licensePlate,
        );
        const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';

        if (!reservationLicensePlate?.trim()) {
          throw new Error('Thiếu biển số xe. Vui lòng cập nhật hồ sơ hoặc chọn xe trước khi thanh toán.');
        }
        if (reservationDate && (!reservationStartTime || !reservationEndTime)) {
          throw new Error('Thiếu khung giờ đặt chỗ. Vui lòng chọn lại thời gian trên trang Reservation.');
        }

        const storedUser = localStorage.getItem('user');
        let loggedInUserId = null;
        if (storedUser) {
          try {
            loggedInUserId = JSON.parse(storedUser).id;
          } catch {
            /* ignore */
          }
        }

        const response = await parkingService.checkin({
          licensePlate: reservationLicensePlate,
          entryPhoto: '',
          parkingLotName,
          parkingLotId,
          vehicleType: reservationVehicleType,
          reservationDate: reservationDate || null,
          reservationEndDate: reservationDate ? reservationEndDate || reservationDate : null,
          reservationStartTime: reservationDate ? reservationStartTime : null,
          reservationEndTime: reservationDate ? reservationEndTime : null,
          parkingSlot: selectedSlot,
          userId: loggedInUserId,
          prepaidAmount: price,
        });
        if (response.data && response.data.qrCode) {
          qrCode = response.data.qrCode;
          addActiveQr(response.data.qrCode);
        }
        localStorage.removeItem('reservationDate');
        localStorage.removeItem('reservationEndDate');
        localStorage.removeItem('reservationStartTime');
        localStorage.removeItem('reservationEndTime');
        localStorage.removeItem('reservationVehicleType');
        localStorage.removeItem('reservationLicensePlate');
      } catch (e: any) {
        console.error('Error creating database active session on reservation', e);
        const defaultErr = 'Vị trí này hiện đã bị khóa hoặc đang bận. Vui lòng chọn vị trí khác!';
        const data = e.response?.data;
        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : '';
        const errMsg =
          e.message?.startsWith('Thiếu')
            ? e.message
            : data?.message || data?.title || validationErrors || defaultErr;
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
      void handleVnPayPayment();
    } else {
      void handleMockPayment();
    }
  };

  let parkingInfo = { name: 'Landmark 81 - Bãi đỗ A1', floor: 'Tầng 1', block: 'Block A' };
  try {
    const raw = localStorage.getItem('selectedParking');
    if (raw) parkingInfo = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  const orderSummary = {
    date:
      mode === 'checkout' && checkoutSession
        ? new Date(checkoutSession.entryTime || checkoutSession.EntryTime).toLocaleDateString('vi-VN')
        : (() => {
            const start = localStorage.getItem('reservationDate');
            const end = localStorage.getItem('reservationEndDate') || start;
            if (!start) return new Date().toLocaleDateString('vi-VN');
            const startLabel = new Date(start).toLocaleDateString('vi-VN');
            if (end && end !== start) {
              return `${startLabel} → ${new Date(end).toLocaleDateString('vi-VN')}`;
            }
            return startLabel;
          })(),
    time:
      mode === 'checkout' && checkoutSession
        ? new Date(checkoutSession.entryTime || checkoutSession.EntryTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : `${localStorage.getItem('reservationStartTime') || ''} - ${localStorage.getItem('reservationEndTime') || ''}`,
    slot:
      mode === 'checkout' && checkoutSession
        ? checkoutSession.parkingSlot || checkoutSession.ParkingSlot
        : localStorage.getItem('selectedSlot') || 'A3',
    parkingName:
      mode === 'checkout' && checkoutSession
        ? checkoutSession.parkingLotName || checkoutSession.ParkingLotName
        : parkingInfo.name,
    plate:
      mode === 'checkout' && checkoutSession
        ? checkoutSession.licensePlate || checkoutSession.LicensePlate
        : licensePlate,
    price,
  };

  return {
    mode,
    loading,
    selectedMethod,
    setSelectedMethod,
    loadingMethod,
    orderSummary,
    handleConfirmPayment,
  };
}
