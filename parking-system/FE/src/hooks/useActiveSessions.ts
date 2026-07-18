import { useState, useEffect } from 'react';
import { parseLicensePlate, getActiveQrs, removeActiveQr, addActiveQr } from '../utils/auth';
import { parkingService } from '../services/parking.service';

export interface SessionData {
  qr: string;
  licensePlate: string;
  slot: string;
  level: string;
  seconds: number;
  entryTime: string | null;
  isCheckedIn: boolean;
  isCompleted?: boolean;
  isCancelled?: boolean;
  exitTime?: string | null;
  exitLicensePlate?: string;
  isPlateMatched?: boolean;
  parkingLotName?: string;
  vehicleType?: string;
}

const getLevelFromSlot = (slot: string | null | undefined): string => {
  if (!slot) return '1';
  const prefix = slot.charAt(0).toUpperCase();
  if (['C', 'D'].includes(prefix)) return '2';
  if (['E', 'F'].includes(prefix)) return '3';
  return '1';
};

export function useActiveSessions() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  useEffect(() => {
    let isMounted = true;

    const fetchAllActiveSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        const results: SessionData[] = [];

        if (token && user) {
          const allResp = await parkingService.getSessionHistory();
          if (allResp.data && Array.isArray(allResp.data)) {
            const mySessions = allResp.data;

            for (const s of mySessions) {
              const sExitTime = s.exitTime || s.ExitTime;
              const sEntryTime = s.entryTime || s.EntryTime;
              const sStatus = s.status || s.Status;
              const sQrCode = s.qrCode || s.QrCode;
              const sParkingSlot = s.parkingSlot || s.ParkingSlot;
              const sIsCheckedIn = s.isCheckedIn ?? s.IsCheckedIn;
              const sParkingLotName = s.parkingLotName || s.ParkingLotName;
              const sLicensePlate = s.licensePlate || s.LicensePlate;

              const diffMs =
                sExitTime && sEntryTime
                  ? new Date(sExitTime).getTime() - new Date(sEntryTime).getTime()
                  : 0;
              const isCompleted = sStatus === 'Completed';
              const isCancelled = sStatus === 'Cancelled';

              if (!isCompleted && !isCancelled && sQrCode) {
                addActiveQr(sQrCode);
              } else if ((isCompleted || isCancelled) && sQrCode) {
                removeActiveQr(sQrCode);
              }

              results.push({
                qr: sQrCode,
                licensePlate: parseLicensePlate(sLicensePlate),
                slot: sParkingSlot || 'A3',
                level: getLevelFromSlot(sParkingSlot),
                seconds: isCompleted ? Math.max(0, Math.floor(diffMs / 1000)) : 0,
                entryTime: sEntryTime || null,
                isCheckedIn: sIsCheckedIn || false,
                isCompleted,
                isCancelled,
                exitTime: sExitTime,
                exitLicensePlate: s.exitLicensePlate || s.ExitLicensePlate,
                isPlateMatched: s.isPlateMatched ?? s.IsPlateMatched,
                parkingLotName: sParkingLotName,
                vehicleType: s.vehicleType || s.VehicleType || 'car',
              });
            }
          }
        } else {
          const qrs = getActiveQrs();
          if (qrs.length > 0) {
            for (const qr of qrs) {
              try {
                const resp = await parkingService.verifySession(qr);
                if (resp.data && resp.data.session) {
                  const s = resp.data.session;
                  const sStatus = s.status || s.Status;
                  if (sStatus === 'Cancelled' || sStatus === 'Completed') {
                    removeActiveQr(qr);
                    continue;
                  }

                  const sLicensePlate = s.licensePlate || s.LicensePlate;
                  const sParkingSlot = s.parkingSlot || s.ParkingSlot;
                  const sEntryTime = s.entryTime || s.EntryTime;
                  const sIsCheckedIn = s.isCheckedIn ?? s.IsCheckedIn;
                  const sParkingLotName = s.parkingLotName || s.ParkingLotName;

                  results.push({
                    qr,
                    licensePlate: parseLicensePlate(sLicensePlate),
                    slot: sParkingSlot || 'A3',
                    level: getLevelFromSlot(sParkingSlot),
                    seconds: 0,
                    entryTime: sEntryTime || null,
                    isCheckedIn: sIsCheckedIn || false,
                    isCompleted: false,
                    isCancelled: false,
                    parkingLotName: sParkingLotName,
                    vehicleType: s.vehicleType || s.VehicleType || 'car',
                  });
                } else {
                  removeActiveQr(qr);
                }
              } catch {
                removeActiveQr(qr);
              }
            }
          }
        }

        const localQrs = getActiveQrs();
        if (localQrs.length > 0) {
          for (const qr of localQrs) {
            if (results.some((r) => r.qr === qr)) continue;
            try {
              const resp = await parkingService.verifySession(qr);
              if (resp.data && resp.data.session) {
                const s = resp.data.session;
                const sStatus = s.status || s.Status;
                if (sStatus === 'Cancelled' || sStatus === 'Completed') {
                  removeActiveQr(qr);
                  continue;
                }

                const sLicensePlate = s.licensePlate || s.LicensePlate;
                const sParkingSlot = s.parkingSlot || s.ParkingSlot;
                const sEntryTime = s.entryTime || s.EntryTime;
                const sIsCheckedIn = s.isCheckedIn ?? s.IsCheckedIn;
                const sParkingLotName = s.parkingLotName || s.ParkingLotName;

                results.push({
                  qr,
                  licensePlate: parseLicensePlate(sLicensePlate),
                  slot: sParkingSlot || 'A3',
                  level: getLevelFromSlot(sParkingSlot),
                  seconds: 0,
                  entryTime: sEntryTime || null,
                  isCheckedIn: sIsCheckedIn || false,
                  isCompleted: false,
                  isCancelled: false,
                  parkingLotName: sParkingLotName,
                  vehicleType: s.vehicleType || s.VehicleType || 'car',
                });
              } else {
                removeActiveQr(qr);
              }
            } catch {
              removeActiveQr(qr);
            }
          }
        }

        if (results.length === 0) {
          if (isMounted) {
            setSessions([]);
            setLoading(false);
          }
          return;
        }

        results.sort((a, b) => {
          if (a.isCompleted === b.isCompleted && a.isCancelled === b.isCancelled) {
            return new Date(b.entryTime || 0).getTime() - new Date(a.entryTime || 0).getTime();
          }
          if (a.isCompleted || a.isCancelled) return 1;
          return -1;
        });

        if (isMounted) {
          setSessions(results);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setSessions([]);
          setLoading(false);
        }
      }
    };

    void fetchAllActiveSessions();

    const syncId = setInterval(() => {
      void fetchAllActiveSessions();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(syncId);
    };
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;
    const tick = () => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.isCompleted) return s;
          if (!s.isCheckedIn || !s.entryTime) return { ...s, seconds: 0 };
          const diffMs = Date.now() - new Date(s.entryTime).getTime();
          return { ...s, seconds: Math.max(0, Math.floor(diffMs / 1000)) };
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessions.length]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
  };

  const calculateFee = (
    entryStr: string | null | undefined,
    exitStr: string | null | undefined,
    vehicleType: string | null | undefined,
  ) => {
    if (!entryStr || !exitStr) return 10000;
    const entry = new Date(entryStr);
    const exit = new Date(exitStr);
    const elapsedMinutes = Math.ceil((exit.getTime() - entry.getTime()) / (60 * 1000));

    let baseRate = 10000;
    let isHourly = true;

    const savedPricing = localStorage.getItem('parking_pricing');
    if (savedPricing) {
      try {
        const parsed = JSON.parse(savedPricing);
        const vType = (vehicleType || 'car').toLowerCase();
        let matched = null;
        if (vType === 'bike') {
          matched = parsed[0];
        } else if (vType === 'car') {
          matched = parsed[1];
        } else if (vType === 'suv') {
          matched = parsed[2];
        }

        if (matched) {
          const cleanPriceStr = matched.price.replace(/[.,]/g, '');
          const parsedPrice = parseFloat(cleanPriceStr);
          if (!isNaN(parsedPrice)) {
            baseRate = parsedPrice;
          }
          isHourly =
            matched.sub.toLowerCase().includes('giờ') || matched.sub.toLowerCase().includes('hour');
        }
      } catch (e) {
        console.error('Error parsing pricing in calculateFee', e);
      }
    }

    if (isHourly) {
      const hours = Math.max(1, Math.ceil(elapsedMinutes / 60));
      return baseRate * hours;
    }
    return baseRate;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const activeSessions = sessions.filter((s) => !s.isCompleted && !s.isCancelled);
  const historySessions = sessions.filter((s) => s.isCompleted || s.isCancelled);

  return {
    loading,
    activeTab,
    setActiveTab,
    activeSessions,
    historySessions,
    formatTime,
    formatDateTime,
    calculateFee,
    formatCurrency,
  };
}
