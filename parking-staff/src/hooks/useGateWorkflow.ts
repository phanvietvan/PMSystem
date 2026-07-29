import { useState, useRef, useEffect } from 'react';
import { parkingService } from '../services/parking.service';
import { playChimeSound, playWarningSound } from '../utils/audio';
import { formatVnDateTime } from '../utils/datetime';

export const useGateWorkflow = (
  selectedParkingLot: string,
  fetchRecentSessions: () => Promise<void>,
  captureFrame: () => string | null,
  checkBlacklistForPlate: (plate: string) => Promise<boolean>,
  showAlert: (msg: string) => void,
  setRecentLogs: React.Dispatch<React.SetStateAction<any[]>>,
  setGeneratedTicket: (ticket: any) => void,
  parkingLots?: any[]
) => {
  const selectedLotObj = parkingLots?.find(p => p.name === selectedParkingLot);
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
    // QR tickets are QR_... or QR-... (seed uses hyphen). Do NOT treat every string starting with "QR" alone.
    const isQrScan = /^QR[_-]/i.test(inputCleanRaw);
    const inputClean = isQrScan
      ? (inputCleanRaw.match(/QR[_-][A-Za-z0-9\-]+/i)?.[0].toUpperCase() || inputCleanRaw)
      : formatPlateNumber(inputCleanRaw);

    // Prefer real camera frame; never fake with Unsplash (broken offline / blocked).
    let livePhoto = captureFrame();
    if (!livePhoto) {
      await new Promise((r) => setTimeout(r, 250));
      livePhoto = captureFrame();
    }

    let entryPhoto = '';
    let entryTimeStr = '';
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

    const pick = (obj: any, ...keys: string[]) => {
      if (!obj) return undefined;
      for (const k of keys) {
        const v = obj[k];
        if (v != null && v !== '') return v;
      }
      return undefined;
    };

    if (gateMode === 'ENTRY') {
      if (isQrScan && inputClean) {
        try {
          const data = await parkingService.verifyQr(inputClean);
          const session = data.session || (data as any).Session;
          const user = data.user || (data as any).User;

          if (!session) {
            playWarningSound();
            showAlert('Phản hồi verify thiếu session — thử quét lại.');
            return;
          }

          const entryResDate = pick(session, 'reservationDate', 'ReservationDate');
          const isReservationEntry = !!entryResDate;

          // Vé vãng lai (không đặt chỗ) không dùng cổng ENTRY QR — sang EXIT thanh toán
          if (!isReservationEntry) {
            playWarningSound();
            showAlert(
              '⚠️ LỘN CỔNG! Vé vãng lai này đã được cấp để gửi xe. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét mã thanh toán!'
            );
            return;
          }

          if (session.isCheckedIn || session.IsCheckedIn) {
            playWarningSound();
            showAlert(
              '⚠️ XE ĐÃ TRONG BÃI! Khách đặt trước này đã quét mã vào cổng rồi. Vui lòng sang MÀN HÌNH LỐI RA (EXIT) để quét ra ngoài!'
            );
            return;
          }

          const sessionLotId = pick(session, 'parkingLotId', 'ParkingLotId');
          const isMismatch = selectedLotObj && sessionLotId
            ? sessionLotId !== selectedLotObj.id
            : pick(session, 'parkingLotName', 'ParkingLotName') &&
              pick(session, 'parkingLotName', 'ParkingLotName') !== selectedParkingLot;

          if (selectedParkingLot && isMismatch) {
            playWarningSound();
            showAlert(
              `⚠️ LỘN TÒA! Khách hàng đặt chỗ tại [${pick(session, 'parkingLotName', 'ParkingLotName')}], nhưng đây là cổng của [${selectedParkingLot}]. Yêu cầu khách di chuyển sang đúng tòa!`
            );
            return;
          }

          entryPlate = pick(session, 'licensePlate', 'LicensePlate') || '';
          parkingSlot = pick(session, 'parkingSlot', 'ParkingSlot');
          parkingLotName = pick(session, 'parkingLotName', 'ParkingLotName');
          ticketType = `Đặt trước • Slot ${parkingSlot} (${parkingLotName})`;
          depositFee = data.prepaidAmount ?? data.PrepaidAmount ?? 0;

          if (user) {
            owner =
              `${pick(user, 'lastName', 'LastName') || ''} ${pick(user, 'firstName', 'FirstName') || ''}`.trim() ||
              'XE ĐẶT TRƯỚC (RESERVATION)';
            userInfo = user;
          } else {
            owner = 'XE ĐẶT TRƯỚC (RESERVATION)';
          }
          foundSessionCode = pick(session, 'qrCode', 'QrCode') || inputClean;
        } catch (e: any) {
          console.warn('QR verification check failed on entry:', e);
          playWarningSound();
          showAlert(e?.message || 'Mã QR đặt chỗ không hợp lệ hoặc đã được sử dụng!');
          return;
        }
      }

      if (entryPlate && (await checkBlacklistForPlate(entryPlate))) {
        return;
      }

      if (!livePhoto) {
        playWarningSound();
        showAlert(
          'Không chụp được ảnh từ camera. Bấm biểu tượng camera / cho phép quyền camera (HTTPS), rồi quét lại.'
        );
        return;
      }

      const payload = {
        plate: entryPlate,
        status: 'Chờ xác nhận',
        time: formatVnDateTime(new Date()),
        owner,
        ticketType,
        capturedPhoto: livePhoto,
        registeredPhoto: livePhoto,
        type: 'ENTRY' as const,
        qrCode: foundSessionCode,
        userInfo,
        parkingSlot,
        parkingLotName,
        depositFee,
      };
      setScannedResult(payload);
      setGateState('COMPARING');
      setManualInput('');
      return;
    }

    // ——— EXIT ———
    if (inputClean) {
      if (!isQrScan) {
        try {
          const sessions = await parkingService.getActiveSessionsByPlates([inputClean]);
          if (sessions && sessions.length > 0) {
            const session = sessions[0];
            entryPhoto = pick(session, 'entryPhoto', 'EntryPhoto') || '';
            const entryTimeVal = pick(session, 'entryTime', 'EntryTime', 'createdAt', 'CreatedAt') || '';
            entryTimeStr = formatVnDateTime(entryTimeVal) || '';
            entryPlate = pick(session, 'licensePlate', 'LicensePlate') || inputClean;
            ticketLabel = `Vé vãng lai • Vào: ${entryTimeStr || 'N/A'}`;
            foundSessionCode = pick(session, 'qrCode', 'QrCode');

            try {
              const checkData = await parkingService.verifyQr(foundSessionCode!);
              computedFee = checkData.fee ?? checkData.Fee ?? 10000;
              depositFee = checkData.prepaidAmount ?? checkData.PrepaidAmount ?? 0;
              const s = checkData.session || checkData.Session || session;
              vehicleType = pick(s, 'vehicleType', 'VehicleType');
              parkingLotName = pick(session, 'parkingLotName', 'ParkingLotName') || parkingLotName;
              parkingSlot = pick(session, 'parkingSlot', 'ParkingSlot');
              // Chủ xe chỉ hiện với đặt trước (có reservation) — không lấy user gắn nhầm từ staff
              const resDate = pick(s, 'reservationDate', 'ReservationDate')
                || pick(session, 'reservationDate', 'ReservationDate');
              if (resDate && (checkData.user || checkData.User)) {
                const u = checkData.user || checkData.User;
                owner = `${pick(u, 'lastName', 'LastName') || ''} ${pick(u, 'firstName', 'FirstName') || ''}`.trim();
                userInfo = u;
                ticketLabel = `Đặt trước • Slot ${parkingSlot} (${parkingLotName})`;
              } else {
                owner = 'KHÁCH VÃNG LAI';
                userInfo = undefined;
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
          const session = data.session || (data as any).Session;
          const user = data.user || (data as any).User;

          if (!session) {
            playWarningSound();
            showAlert('Phản hồi verify thiếu session — thử quét lại.');
            return;
          }

          if (
            pick(session, 'reservationDate', 'ReservationDate') &&
            !(session.isCheckedIn || session.IsCheckedIn)
          ) {
            playWarningSound();
            showAlert('⚠️ LỖI: Xe đặt trước này CHƯA QUÉT VÀO BÃI. Không thể cho ra!');
            return;
          }

          entryPhoto = pick(session, 'entryPhoto', 'EntryPhoto') || '';
          const entryTimeVal = pick(session, 'entryTime', 'EntryTime', 'createdAt', 'CreatedAt') || '';
          entryTimeStr = formatVnDateTime(entryTimeVal) || '';
          entryPlate = pick(session, 'licensePlate', 'LicensePlate') || '';
          computedFee = data.fee ?? data.Fee ?? 0;
          depositFee = data.prepaidAmount ?? data.PrepaidAmount ?? 0;
          vehicleType = pick(session, 'vehicleType', 'VehicleType');
          parkingSlot = pick(session, 'parkingSlot', 'ParkingSlot');
          parkingLotName = pick(session, 'parkingLotName', 'ParkingLotName');
          reservationDate = pick(session, 'reservationDate', 'ReservationDate') || '';
          reservationStartTime = pick(session, 'reservationStartTime', 'ReservationStartTime') || '';
          foundSessionCode = pick(session, 'qrCode', 'QrCode') || inputClean;

          // Vé vãng lai: không hiện chủ xe (kể cả khi DB từng gắn nhầm UserId staff)
          const isReservationTicket = !!reservationDate;
          ticketLabel = isReservationTicket
            ? `Đặt trước • Slot ${parkingSlot} (${parkingLotName})`
            : 'Vé vãng lai';

          if (isReservationTicket && user) {
            owner =
              `${pick(user, 'lastName', 'LastName') || ''} ${pick(user, 'firstName', 'FirstName') || ''}`.trim() ||
              'KHÁCH ĐẶT TRƯỚC (APP)';
            userInfo = user;
          } else {
            owner = 'KHÁCH VÃNG LAI';
            userInfo = undefined;
          }
        } catch (e: any) {
          playWarningSound();
          showAlert(e?.message || 'Mã QR không hợp lệ hoặc vé này đã thanh toán rời bãi!');
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
      time: formatVnDateTime(new Date()),
      owner: owner,
      ticketType: ticketLabel,
      capturedPhoto: livePhoto || '',
      registeredPhoto: entryPhoto,
      type: 'EXIT' as const,
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
      // Re-capture at confirm so we always persist a real frame when possible
      const freshPhoto = captureFrame() || scannedResult.capturedPhoto;
      if (!freshPhoto || String(freshPhoto).startsWith('http')) {
        showAlert('Thiếu ảnh camera lúc vào. Cho phép camera rồi xác nhận lại.');
        setIsOcrLoading(false);
        return;
      }

      let session: any;
      if (scannedResult.qrCode) {
        const data = await parkingService.gateScan({
          qrCode: scannedResult.qrCode,
          entryPhoto: freshPhoto,
        });
        session = (data as any).session || data;
      } else {
        const data = await parkingService.checkin({
          licensePlate: scannedResult.plate,
          entryPhoto: freshPhoto,
          parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
          parkingLotId: selectedLotObj?.id,
          vehicleType: 'Car',
        });
        session = (data as any).session || data;
      }

      playChimeSound();
      setGeneratedTicket({
        qrCode: session.qrCode,
        plate: session.licensePlate,
        time: formatVnDateTime(session.entryTime || session.createdAt || ''),
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
    photo: scannedResult ? scannedResult.capturedPhoto : '',
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
