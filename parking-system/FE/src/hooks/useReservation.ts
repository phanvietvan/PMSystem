import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMySession } from './useMySession';
import { useParkingLots } from './useParkingLots';
import { parkingService } from '../services/parking.service';

import { vnDateISO, vnTimeHM } from '../utils/datetime';

const DEFAULT_LOTS = [
  { id: 1, name: 'Landmark 81 - Bãi đỗ A1', latitude: '10.7949', longitude: '106.7218', floor: 'Tầng 1', block: 'Block A' },
  { id: 2, name: 'Bitexco Financial - Bãi đỗ B2', latitude: '10.7717', longitude: '106.7044', floor: 'Tầng 2', block: 'Block B' },
  { id: 3, name: 'Vincom Center - Bãi đỗ V3', latitude: '10.7781', longitude: '106.7020', floor: 'Hầm B3', block: 'Block V' },
  { id: 4, name: 'Saigon Centre - Bãi đỗ S1', latitude: '10.7736', longitude: '106.7013', floor: 'Tầng 4', block: 'Block S' },
  { id: 5, name: 'Lotte Mart Q7 - Bãi đỗ L1', latitude: '10.7482', longitude: '106.7023', floor: 'Hầm B1', block: 'Block L' },
  { id: 6, name: 'Crescent Mall Q7 - Bãi đỗ C1', latitude: '10.7287', longitude: '106.7169', floor: 'Tầng G', block: 'Block C' },
  { id: 7, name: 'Sân bay Tân Sơn Nhất - Block A', latitude: '10.8160', longitude: '106.6630', floor: 'Ga quốc tế', block: 'Khu vực A' },
];

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** Local calendar date+time from form fields (YYYY-MM-DD + HH:mm). */
const combineLocal = (dateISO: string, hm: string): Date => {
  const [y, mo, d] = (dateISO || '').split('-').map((x) => parseInt(x, 10));
  const [h, mi] = (hm || '00:00').split(':').map((x) => parseInt(x, 10));
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, 0, 0);
};

const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatLocalHm = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** If end <= start, push end to start + addHours (default 1h). */
const forceEndAfterStart = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  addHours = 1
): { endDate: string; endTime: string; adjusted: boolean } => {
  const start = combineLocal(startDate, startTime);
  const end = combineLocal(endDate, endTime);
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
    return { endDate, endTime, adjusted: false };
  }
  const fixed = new Date(start.getTime() + addHours * 60 * 60 * 1000);
  return {
    endDate: formatLocalDate(fixed),
    endTime: formatLocalHm(fixed),
    adjusted: true,
  };
};

/** End datetime = start + hours (handles overnight). */
const endFromStartPlusHours = (startDate: string, startTime: string, hours: number) => {
  const start = combineLocal(startDate, startTime);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  return { endDate: formatLocalDate(end), endTime: formatLocalHm(end) };
};

/** Local calendar date YYYY-MM-DD in Vietnam (UTC+7). */
const localDateISO = (d = new Date()) => vnDateISO(d);

/** Map profile/UI vehicle type → canonical fee category used by BE pricing. */
export const mapReservationVehicleType = (type?: string | null): string => {
  const t = (type || 'car').trim().toLowerCase();
  if (
    t === 'motorbike' ||
    t === 'motorcycle' ||
    t === 'bicycle' ||
    t.includes('bike') ||
    t.includes('máy') ||
    t.includes('đạp') ||
    t.includes('điện')
  ) {
    return 'bike';
  }
  if (t.includes('suv') || t.includes('bán') || t.includes('tai') || t.includes('pickup')) {
    return 'suv';
  }
  if (t.includes('car') || t.includes('ô tô') || t.includes('oto') || t.includes('4-7') || t.includes('sedan')) {
    return 'car';
  }
  return 'car';
};

/** UI label — case-insensitive; never treat unknown/`car` as bicycle. */
export const getVehicleTypeLabel = (type?: string | null): string => {
  const t = (type || '').trim().toLowerCase();
  if (!t) return 'Ô tô';
  if (t === 'car' || t.includes('ô tô') || t.includes('oto') || t.includes('sedan') || t.includes('4-7')) {
    return 'Ô tô';
  }
  if (t === 'suv' || t.includes('suv') || t.includes('bán tải') || t.includes('pickup')) {
    return 'SUV / Bán tải';
  }
  if (
    t === 'motorbike' ||
    t === 'motorcycle' ||
    t === 'moto' ||
    t.includes('xe máy') ||
    (t.includes('máy') && !t.includes('đạp'))
  ) {
    return 'Xe máy';
  }
  if (t === 'bicycle' || t.includes('đạp') || (t.includes('điện') && !t.includes('ô'))) {
    return 'Xe đạp/Xe điện';
  }
  // BE fee category "bike" (máy + đạp gộp) — show Xe máy as default label
  if (t === 'bike') return 'Xe máy';
  return 'Ô tô';
};

export function useReservation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fromStatus, setFromStatus] = useState(() => !!location.state?.fromStatus);
  const bypassActiveCheck = location.state?.bypassActiveCheck || false;
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { syncMySession } = useMySession({ requireAuth: !bypassActiveCheck });
  const { fetchParkingLots } = useParkingLots({ autoFetch: false });

  const [parkingLots, setParkingLots] = useState<any[]>(() => {
    const stored = localStorage.getItem('selectedParking');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && !DEFAULT_LOTS.some((p: any) => p.id === parsed.id)) {
          return [...DEFAULT_LOTS, parsed];
        }
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_LOTS;
  });

  useEffect(() => {
    const loadLots = async () => {
      try {
        const data = await fetchParkingLots();
        if (Array.isArray(data) && data.length > 0) {
          setParkingLots(data);
        }
      } catch (e) {
        console.error('Error fetching parking lots:', e);
      }
    };
    void loadLots();
  }, [fetchParkingLots]);

  const today = localDateISO();
  const currentTime = vnTimeHM();
  const initialEnd = endFromStartPlusHours(today, currentTime, 2);

  const [formData, setFormData] = useState(() => {
    const storedParking = localStorage.getItem('selectedParking');
    let initialParkingLotId = 1;
    if (storedParking) {
      try {
        const parsed = JSON.parse(storedParking);
        if (parsed && parsed.id) {
          initialParkingLotId = parsed.id;
        } else {
          const matched = DEFAULT_LOTS.find((p: any) => p.name === parsed?.name);
          if (matched) initialParkingLotId = matched.id;
        }
      } catch {
        /* ignore */
      }
    }
    return {
      startDate: today,
      endDate: initialEnd.endDate,
      startTime: currentTime,
      endTime: initialEnd.endTime,
      licensePlate: '',
      vehicleType: 'car',
      parkingLotId: initialParkingLotId,
    };
  });

  const showTimeError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const handleStartTimeChange = (newTime: string) => {
    setFormData((prev) => {
      const { endDate, endTime } = endFromStartPlusHours(prev.startDate, newTime, 2);
      return {
        ...prev,
        startTime: newTime,
        endDate,
        endTime,
      };
    });
  };

  const handleEndTimeChange = (newTime: string) => {
    setFormData((prev) => {
      const result = forceEndAfterStart(prev.startDate, prev.startTime, prev.endDate, newTime, 1);
      if (result.adjusted) {
        showTimeError('Giờ kết thúc phải sau giờ bắt đầu!');
      }
      return {
        ...prev,
        endDate: result.endDate,
        endTime: result.endTime,
      };
    });
  };

  const handleEndDateChange = (newDate: string) => {
    setFormData((prev) => {
      const endDate = newDate < prev.startDate ? prev.startDate : newDate;
      if (newDate < prev.startDate) {
        showTimeError('Ngày kết thúc không được trước ngày bắt đầu!');
      }
      const result = forceEndAfterStart(prev.startDate, prev.startTime, endDate, prev.endTime, 1);
      if (result.adjusted) {
        showTimeError('Thời điểm kết thúc phải sau thời điểm bắt đầu!');
      }
      return {
        ...prev,
        endDate: result.endDate,
        endTime: result.endTime,
      };
    });
  };

  const handleStartDateChange = (newDate: string) => {
    setFormData((prev) => {
      const startDate = newDate;
      let { endDate, endTime } = prev;
      if (endDate < startDate) {
        endDate = startDate;
      }
      const result = forceEndAfterStart(startDate, prev.startTime, endDate, endTime, 1);
      return {
        ...prev,
        startDate,
        endDate: result.endDate,
        endTime: result.endTime,
      };
    });
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting user geolocation:', error);
        },
      );
    }
  }, []);

  const sortedParkingLots = useMemo(() => {
    const lotsWithDistance = parkingLots.map((lot) => {
      if (userCoords && lot.latitude && lot.longitude) {
        const dist = getDistance(
          userCoords.latitude,
          userCoords.longitude,
          parseFloat(lot.latitude),
          parseFloat(lot.longitude),
        );
        return { ...lot, distance: dist };
      }
      return { ...lot, distance: null };
    });

    return [...lotsWithDistance].sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });
  }, [parkingLots, userCoords]);

  useEffect(() => {
    if (userCoords && sortedParkingLots.length > 0) {
      const storedSelected = localStorage.getItem('selectedParking');
      if (!storedSelected) {
        setFormData((prev) => ({
          ...prev,
          parkingLotId: sortedParkingLots[0].id,
        }));
      }
    }
  }, [userCoords, sortedParkingLots]);

  const selectedParking =
    sortedParkingLots.find((p: any) => p.id === formData.parkingLotId) ||
    sortedParkingLots[0] ||
    parkingLots[0];

  const [isSlotSelected, setIsSlotSelected] = useState(fromStatus);
  const [currentSlot, setCurrentSlot] = useState(() => localStorage.getItem('selectedSlot') || '');
  const [userVehicles, setUserVehicles] = useState<Array<{ plate: string; type: string }>>([]);
  const [activePlates, setActivePlates] = useState<
    Array<{ plate: string; parkingLotName: string }>
  >([]);

  useEffect(() => {
    if (!bypassActiveCheck) {
      void syncMySession();
    }

    const init = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      try {
        const parsed = JSON.parse(storedUser);
        const lp = parsed.licensePlate || '';
        let parsedVehicles: Array<{ plate: string; type: string }> = [];

        // Support new BE format after 3NF normalization: vehicles[] array
        // BE AuthService may now return a `vehicles` field with normalized data
        if (Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0) {
          parsedVehicles = parsed.vehicles.map((v: any) => ({
            plate: v.plate || v.licensePlate || v.LicensePlate || '',
            type: v.type || v.vehicleType || v.VehicleType || 'Car',
          }));
        } else if (lp.startsWith('[')) {
          // Old format: JSON array packed as string in licensePlate field
          parsedVehicles = JSON.parse(lp);
        } else if (lp) {
          // Old format: single plate string
          parsedVehicles = [{ plate: lp, type: parsed.vehicleType || 'Car' }];
        }

        setUserVehicles(parsedVehicles);

        try {
          const resp = await parkingService.getActivePlates();
          const data: any[] = resp.data || [];
          const normalizedActive = data.map((item: any) => ({
            plate: (item.licensePlate || item.LicensePlate || '')
              .replace(/[-. ]/g, '')
              .toUpperCase(),
            parkingLotName: item.parkingLotName || item.ParkingLotName || '',
          }));
          setActivePlates(normalizedActive);

          const currentLotName =
            parkingLots.find((p: any) => p.id === formData.parkingLotId)?.name ||
            parkingLots[0].name;
          const firstAvailable = parsedVehicles.find((v) => {
            const norm = v.plate.replace(/[-. ]/g, '').toUpperCase();
            return !normalizedActive.some(
              (a) => a.plate === norm && a.parkingLotName === currentLotName,
            );
          });
          if (firstAvailable) {
            setFormData((prev) => ({
              ...prev,
              licensePlate: firstAvailable.plate,
              vehicleType: mapReservationVehicleType(firstAvailable.type),
            }));
          } else if (parsedVehicles.length > 0) {
            setFormData((prev) => ({ ...prev, licensePlate: 'CUSTOM', vehicleType: 'car' }));
          }
        } catch {
          if (parsedVehicles.length > 0) {
            setFormData((prev) => ({
              ...prev,
              licensePlate: parsedVehicles[0].plate,
              vehicleType: mapReservationVehicleType(parsedVehicles[0].type),
            }));
          }
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      setErrorToast('Vui lòng chọn ngày bắt đầu và ngày kết thúc!');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    if (formData.endDate < formData.startDate) {
      setErrorToast('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    const startAt = combineLocal(formData.startDate, formData.startTime || '00:00');
    const endAt = combineLocal(formData.endDate, formData.endTime || '00:00');
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      setErrorToast('Thời điểm kết thúc phải sau thời điểm bắt đầu!');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    localStorage.setItem('selectedParking', JSON.stringify(selectedParking));
    localStorage.setItem('reservationDate', formData.startDate);
    localStorage.setItem('reservationEndDate', formData.endDate);
    localStorage.setItem('reservationStartTime', formData.startTime);
    localStorage.setItem('reservationEndTime', formData.endTime);
    localStorage.setItem('reservationVehicleType', formData.vehicleType);
    localStorage.setItem('reservationLicensePlate', formData.licensePlate);

    if (isSlotSelected && currentSlot) {
      navigate('/payment', { state: { mode: 'reserve' } });
    } else {
      localStorage.removeItem('selectedSlot');
      localStorage.removeItem('selectedLevel');
      navigate('/status', {
        state: {
          selectedParking,
          fromReserve: true,
          bypassActiveCheck: location.state?.bypassActiveCheck,
        },
      });
    }
  };

  const unlockParkingLotSelection = () => {
    setIsSlotSelected(false);
    setCurrentSlot('');
    localStorage.removeItem('selectedSlot');
    setFromStatus(false);
    setIsDropdownOpen(true);
  };

  return {
    fromStatus,
    errorToast,
    parkingLots,
    today,
    formData,
    setFormData,
    handleStartTimeChange,
    handleEndTimeChange,
    handleStartDateChange,
    handleEndDateChange,
    isDropdownOpen,
    setIsDropdownOpen,
    isVehicleDropdownOpen,
    setIsVehicleDropdownOpen,
    userCoords,
    sortedParkingLots,
    selectedParking,
    isSlotSelected,
    setIsSlotSelected,
    currentSlot,
    setCurrentSlot,
    userVehicles,
    activePlates,
    unlockParkingLotSelection,
    handleSubmit,
    getDistance,
  };
}
