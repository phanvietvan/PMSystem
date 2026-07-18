import { useCallback, useEffect, useState } from 'react';
import { addActiveQr } from '../utils/auth';
import { parkingService } from '../services/parking.service';

type SyncOptions = {
  /** Gọi khi server báo không còn session */
  onCleared?: () => void;
  /** Chỉ sync khi có token (mặc định true) */
  requireAuth?: boolean;
};

/**
 * Đồng bộ session đang gửi xe từ API → localStorage QR.
 * Dùng ở Landing / Pricing / ParkingStatus / Reservation.
 */
export function useMySession(options: SyncOptions = {}) {
  const { onCleared, requireAuth = true } = options;
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const syncMySession = useCallback(async () => {
    if (requireAuth && !localStorage.getItem('token')) return null;

    setLoading(true);
    try {
      const res = await parkingService.getMySession();
      if (!res.data) return null;

      if (res.data.hasActiveSession && res.data.session) {
        const s = res.data.session;
        const sQrCode = s.qrCode || s.QrCode;
        if (sQrCode) addActiveQr(sQrCode);
        setHasActiveSession(true);
        setSession(s);
        return s;
      }

      localStorage.removeItem('activeSessionQrs');
      localStorage.removeItem('activeSessionQr');
      setHasActiveSession(false);
      setSession(null);
      onCleared?.();
      return null;
    } catch (err) {
      console.log('Error syncing active session:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onCleared, requireAuth]);

  useEffect(() => {
    void syncMySession();
  }, [syncMySession]);

  return { hasActiveSession, session, loading, syncMySession };
}
