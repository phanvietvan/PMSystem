import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseLicensePlate } from '../utils/auth';
import QRCode from 'qrcode';
import { parkingService } from '../services/parking.service';

export function useSuccessSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || 'reserve';
  const qrCode = location.state?.qrCode || '';
  const [status, setStatus] = useState<'qr' | 'opening'>(mode === 'checkout' ? 'opening' : 'qr');
  const [licensePlate, setLicensePlate] = useState('51F-123.45');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const selectedSlot = localStorage.getItem('selectedSlot') || 'A3';

  let parkingInfo = { name: 'Landmark 81 - Bãi đỗ A1', floor: 'Tầng 1', block: 'Block A' };
  try {
    const raw = localStorage.getItem('selectedParking');
    if (raw) parkingInfo = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  let displayFloor = parkingInfo.floor;
  if (selectedSlot && selectedSlot !== 'Auto') {
    const prefix = selectedSlot.charAt(0).toUpperCase();
    if (prefix === 'A' || prefix === 'B') displayFloor = 'Tầng 1';
    else if (prefix === 'C' || prefix === 'D') displayFloor = 'Tầng 2';
    else if (prefix === 'E' || prefix === 'F') displayFloor = 'Tầng 3';
  } else {
    if (displayFloor === 'Tầng 1') displayFloor = 'Tầng 1';
    else if (displayFloor === 'Tầng 2') displayFloor = 'Tầng 2';
    else if (displayFloor === 'Tầng 3') displayFloor = 'Tầng 3';
  }

  const resStartDate = localStorage.getItem('reservationDate');
  const resEndDate = localStorage.getItem('reservationEndDate') || resStartDate;
  const resDate = resStartDate
    ? resEndDate && resEndDate !== resStartDate
      ? `${new Date(resStartDate).toLocaleDateString('vi-VN')} → ${new Date(resEndDate).toLocaleDateString('vi-VN')}`
      : new Date(resStartDate).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN');
  const resTime =
    localStorage.getItem('reservationStartTime') ||
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, { width: 300, margin: 1 }, (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      });
    }
  }, [qrCode]);

  useEffect(() => {
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
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }

    if (!qrCode) {
      const timer = setTimeout(() => {
        setStatus('opening');
        const navTimer = setTimeout(() => {
          navigate('/navigation');
        }, 4000);
        return () => clearTimeout(navTimer);
      }, 12000);
      return () => clearTimeout(timer);
    }

    let isCleared = false;
    const pollInterval = setInterval(async () => {
      try {
        const res = await parkingService.verifySession(qrCode);
        if (res.data && res.data.session && res.data.session.isCheckedIn) {
          clearInterval(pollInterval);
          isCleared = true;
          setStatus('opening');

          setTimeout(() => {
            navigate('/navigation');
          }, 4000);
        }
      } catch (err) {
        console.error('Error polling session status', err);
      }
    }, 2000);

    return () => {
      if (!isCleared) clearInterval(pollInterval);
    };
  }, [navigate, mode, qrCode]);

  return {
    mode,
    qrCode,
    status,
    licensePlate,
    qrDataUrl,
    selectedSlot,
    parkingInfo,
    displayFloor,
    resDate,
    resTime,
  };
}
