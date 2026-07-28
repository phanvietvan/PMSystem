import { useState, useRef, useEffect } from 'react';
import { parkingService } from '../services/parking.service';
import { playChimeSound, playWarningSound } from '../utils/audio';

const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

export const useGateWorkflow = (
  selectedParkingLot: string,
  fetchRecentSessions: () => Promise<void>,
  captureFrame: () => string | null,
  checkBlacklistForPlate: (plate: string) => Promise<boolean>,
  showAlert: (msg: string) => void,
  setRecentLogs: React.Dispatch<React.SetStateAction<any[]>>,
  setGeneratedTicket: (ticket: any) => void
) => {
  const [gateState, setGateState] = useState<'SCANNING' | 'COMPARING' | 'GATE_OPEN'>('SCANNING');
  const [gateMode, setGateMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [manualInput, setManualInput] = useState('');
  const autoApprove = false;
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [extraFees, setExtraFees] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [isAddingSurcharge, setIsAddingSurcharge] = useState(false);
  const [surchargeDraft, setSurchargeDraft] = useState({ name: 'Phụ thu khác', amount: '' });
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  const countdownTimerRef = useRef<any>(null);

  const formatPlateNumber = (plate: string): string => {
    if (!plate) return '';
    return plate.trim().toUpperCase();
  };

  const startAutoPassCountdown = () => {
    if (gateMode === 'ENTRY') return;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    const initialSecs = 2.5;
    setCountdown(initialSecs);
    setIsCountdownActive(true);

    let current = initialSecs;
    countdownTimerRef.current = setInterval(() => {
      current -= 0.5;
      if (current <= 0) {
        clearInterval(countdownTimerRef.current);
        confirmPass();
      } else {
        setCountdown(current);
      }
    }, 500);
  };

  const triggerScan = async (customPlateOrQr?: string) => {
    playChimeSound();

    const inputCleanRaw = (customPlateOrQr || '').trim().toUpperCase();
    const isQrScan = inputCleanRaw.startsWith('QR_') || inputCleanRaw.startsWith('QR');
    const inputClean = isQrScan ? inputCleanRaw : formatPlateNumber(inputCleanRaw);

    const livePhoto = captureFrame() || FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];
    const fallbackEntryPhoto = FALLBACK_CAR_CAPTURES[1];

    let entryPhoto = fallbackEntryPhoto;
    let entryTimeStr = 'N/A';
    let entryPlate = isQrScan
      ? ''
      : inputClean ||
        formatPlateNumber(
          '30F-' +
            Math.floor(100 + Math.random() * 900) +
            '.' +
            Math.floor(10 + Math.random() * 90)
        );
    let ticketLabel = gateMode === 'ENTRY' ? 'Vé vãng lai' : 'Vé vãng lai • Phí: 10,000 VNĐ';
    let foundSessionCode = isQrScan ? inputClean : undefined;
    let computedFee = 10000;

    let owner = 'KHÁCH VÃNG LAI';
    let ticketType = 'Vé vãng lai';
    let userInfo: any = undefined;
    let reservationDate = '';
    let reservationStartTime = '';
    let parkingSlot: string | undefined = undefined;
    let parkingLotName: string | undefined = undefined;
    let depositFee: number = 0;
    let vehicleType: string | undefined = undefined;

    if (gateMode === 'ENTRY') {
      if (isQrScan && inputClean) {
        try {
          const data = await parkingService.verifyQr(inputClean);
          const session = data.session;
          const user = data.user;

          if (!session.userId) {
            playWarningSound();
            showAlert(
              '⚠️ LỘN CỔNG! Vé vãng lai này đã được cấp để gửi xe. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét mã thanh toán!'
            );
            return;
          }

          if (session.isCheckedIn) {
            playWarningSound();
            showAlert(
              '⚠️ XE ĐÃ TRONG BÃI! Khách đặt trước này đã quét mã vào cổng rồi. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét ra ngoài!'
            );
            return;
          }

          if (selectedParkingLot && session.parkingLotName && session.parkingLotName !== selectedParkingLot) {
            playWarningSound();
            showAlert(
              `⚠️ LỘN TÒA! Khách hàng đặt chỗ tại [${session.parkingLotName}], nhưng đây là cổng của [${selectedParkingLot}]. Yêu cầu khách di chuyển sang đúng tòa!`
            );
            return;
          }

          entryPlate = session.licensePlate;
          ticketType = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
          parkingSlot = session.parkingSlot;
          parkingLotName = session.parkingLotName;
          depositFee = data.prepaidAmount || 0;

          if (user) {
            owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'XE ĐẶT TRƯỚC (RESERVATION)';
            userInfo = user;
          } else {
            owner = 'XE ĐẶT TRƯỚC (RESERVATION)';
          }
          foundSessionCode = session.qrCode;
        } catch (e) {
          console.warn('QR verification check failed on entry:', e);
          playWarningSound();
          showAlert('Mã QR đặt chỗ không hợp lệ hoặc đã được sử dụng!');
          return;
        }
      }

      if (entryPlate && (await checkBlacklistForPlate(entryPlate))) {
      return;
    }

    const payload = {
      plate: entryPlate,
      status: 'Chờ xác nhận',
      time: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      owner: owner,
      ticketType: ticketType,
      capturedPhoto: livePhoto,
      registeredPhoto: livePhoto,
      type: 'ENTRY',
      qrCode: foundSessionCode,
      userInfo: userInfo,
      parkingSlot: parkingSlot,
      parkingLotName: parkingLotName,
      depositFee: depositFee,
    };
    setScannedResult(payload);
    setGateState('COMPARING');
    setManualInput('');
    return;
  } else {
    if (inputClean) {
      if (!isQrScan) {
        try {
          const sessions = await parkingService.getActiveSessionsByPlates([inputClean]);
          if (sessions && sessions.length > 0) {
            const session = sessions[0];
            entryPhoto = session.entryPhoto || '';
            const entryTimeVal = session.entryTime || session.createdAt || '';
            entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            entryPlate = session.licensePlate;
            ticketLabel = `Vé vãng lai • Vào: ${entryTimeStr}`;
            foundSessionCode = session.qrCode;

            try {
              const checkData = await parkingService.verifyQr(session.qrCode);
              computedFee = checkData.fee ?? checkData.Fee ?? 10000;
              depositFee = checkData.prepaidAmount ?? checkData.PrepaidAmount ?? 0;
              vehicleType =
                checkData.session?.vehicleType ||
                checkData.session?.VehicleType ||
                checkData.Session?.vehicleType ||
                checkData.Session?.VehicleType ||
                session.vehicleType ||
                session.VehicleType;
              if (checkData.user || checkData.User) {
                const u = checkData.user || checkData.User;
                owner = `${u.lastName || u.LastName || ''} ${u.firstName || u.FirstName || ''}`.trim();
                userInfo = u;
                ticketLabel = `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`;
                parkingSlot = session.parkingSlot;
                parkingLotName = session.parkingLotName;
              }
            } catch {}
          } else {
            playWarningSound();
            showAlert(`Không tìm thấy xe mang biển số ${inputClean} đang gửi trong bãi!`);
            return;
          }
        } catch (e) {
          console.warn('Active-by-plates check failed:', e);
        }
      } else {
        try {
          const data = await parkingService.verifyQr(inputClean);
          const session = data.session;
          const user = data.user;

          if (session.userId && !session.isCheckedIn) {
            playWarningSound();
            showAlert('⚠️ LỖI: Xe đặt trước này CHƯA QUÉT VÀO BÃI. Không thể cho ra!');
            return;
          }

          entryPhoto = session.entryPhoto || '';
          const entryTimeVal = session.entryTime || session.createdAt || '';
          entryTimeStr = new Date(entryTimeVal).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          entryPlate = session.licensePlate;
          computedFee = data.fee ?? data.Fee ?? 0;
          depositFee = data.prepaidAmount ?? data.PrepaidAmount ?? 0;
          vehicleType = session.vehicleType || session.VehicleType;
          ticketLabel = session.userId
            ? `Đặt trước • Slot ${session.parkingSlot} (${session.parkingLotName})`
            : 'Vé vãng lai (Máy tự động)';
          parkingSlot = session.parkingSlot;
          parkingLotName = session.parkingLotName;
          foundSessionCode = session.qrCode;
          reservationDate = session.reservationDate || '';
          reservationStartTime = session.reservationStartTime || '';

          if (user) {
            owner = `${user.lastName || ''} ${user.firstName || ''}`.trim() || 'KHÁCH ĐẶT TRƯỚC (APP)';
            userInfo = user;
          } else {
            owner = 'KHÁCH VÃNG LAI';
            userInfo = undefined;
          }
        } catch (e) {
          playWarningSound();
          showAlert('Mã QR không hợp lệ hoặc vé này đã thanh toán rời bãi!');
          return;
        }
      }
    }

    if (entryPlate && (await checkBlacklistForPlate(entryPlate))) {
      return;
    }

    const payload = {
      plate: entryPlate,
      exitPlate: entryPlate,
      status: 'Hợp lệ',
      time: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      owner: owner,
      ticketType: ticketLabel,
      capturedPhoto: livePhoto,
      registeredPhoto: entryPhoto,
      type: 'EXIT',
      qrCode: foundSessionCode,
      fee: computedFee,
      userInfo: userInfo,
      entryTime: entryTimeStr,
      reservationDate: reservationDate,
      reservationStartTime: reservationStartTime,
      parkingSlot: parkingSlot,
      parkingLotName: parkingLotName,
      depositFee: depositFee,
      vehicleType: vehicleType,
    };

    setScannedResult(payload);
    setGateState('COMPARING');
    setManualInput('');

    if (autoApprove) {
      setTimeout(() => startAutoPassCountdown(), 100);
    }
  }
};

const handleOcrAndScan = async () => {
  if (manualInput.trim()) {
    const input = manualInput.trim().toUpperCase();
    setManualInput('');
    await triggerScan(input);
  }
};

const confirmPass = async () => {
  if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  setIsCountdownActive(false);

  if (!scannedResult) return;

  if (scannedResult.type === 'ENTRY') {
    setIsOcrLoading(true);
    try {
      let session: any;
      if (scannedResult.qrCode) {
        const data = await parkingService.gateScan({
          qrCode: scannedResult.qrCode,
          entryPhoto: scannedResult.capturedPhoto,
        });
        session = (data as any).session || data;
      } else {
        const data = await parkingService.checkin({
          licensePlate: scannedResult.plate,
          entryPhoto: scannedResult.capturedPhoto,
          parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
          vehicleType: 'Car',
        });
        session = (data as any).session || data;
      }

      playChimeSound();
      setGeneratedTicket({
        qrCode: session.qrCode,
        plate: session.licensePlate,
        time: new Date(session.entryTime || session.createdAt || '').toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        photo: session.entryPhoto || scannedResult.capturedPhoto,
        vehicleType: session.vehicleType || 'Car',
        parkingLotName: session.parkingLotName || selectedParkingLot || 'Khu Vực A',
      });
      setGateState('GATE_OPEN');
    } catch (err: any) {
      console.warn('Database check-in / gate-scan failed:', err);
      showAlert(err.message || 'Lỗi kết nối đến máy chủ.');
    }
    setIsOcrLoading(false);
  } else {
    setGateState('GATE_OPEN');
    playChimeSound();

    try {
      const qrCodeToPost = scannedResult.qrCode || `QR_MOCK_${scannedResult.plate}`;
      await parkingService.checkout({
        qrCode: qrCodeToPost,
        exitLicensePlate: scannedResult.exitPlate || scannedResult.plate,
        exitPhoto: scannedResult.capturedPhoto,
        extraFees: extraFees.map((f) => ({ name: f.name, amount: f.amount })),
      });
    } catch (e) {
      console.warn(e);
    }

    setTimeout(async () => {
      await fetchRecentSessions();
      setScannedResult(null);
      setGateState('SCANNING');
    }, 2200);
  }
};

const denyPass = () => {
  if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  setIsCountdownActive(false);
  playWarningSound();

  const alertLog = {
    plate: scannedResult ? scannedResult.plate : 'CẢNH BÁO',
    status: 'Từ chối / Báo động',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: 'ALERT',
    owner: scannedResult ? scannedResult.owner : 'N/A',
    ticketType: scannedResult ? scannedResult.ticketType : 'Kẻ lạ',
    photo: scannedResult ? scannedResult.capturedPhoto : FALLBACK_CAR_CAPTURES[0],
  };

  setRecentLogs((prev) => [alertLog, ...prev.slice(0, 5)]);
  setScannedResult(null);
  setExtraFees([]);
  setIsAddingSurcharge(false);
  setGateState('SCANNING');
};

// Cleanup timers on unmount
useEffect(() => {
  return () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  };
}, []);

return {
  gateState,
  setGateState,
  gateMode,
  setGateMode,
  manualInput,
  setManualInput,
  autoApprove,
  scannedResult,
  setScannedResult,
  countdown,
  isCountdownActive,
  setIsCountdownActive,
  extraFees,
  setExtraFees,
  isAddingSurcharge,
  setIsAddingSurcharge,
  surchargeDraft,
  setSurchargeDraft,
  isOcrLoading,
  triggerScan,
  handleOcrAndScan,
  confirmPass,
  denyPass,
  startAutoPassCountdown,
  countdownTimerRef,
};
};
