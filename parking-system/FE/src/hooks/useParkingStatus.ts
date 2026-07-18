import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasActiveSessions } from '../utils/auth';
import { parkingService } from '../services/parking.service';
import { useParkingLots } from './useParkingLots';
import { useMySession } from './useMySession';

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'locked';

export interface ParkingSlot {
  id: string;
  status: SlotStatus;
  isBest?: boolean;
}

export const generateSlots = (
  prefix: string,
  count: number,
  level: number,
  slotStatusMap: Record<string, SlotStatus> = {},
  lockedSlots: string[] = [],
): ParkingSlot[] => {
  const startChar = prefix === 'A' ? 65 : 66;
  const offset = (level - 1) * 2;
  const actualPrefix = String.fromCharCode(startChar + offset);

  return Array.from({ length: count }, (_, i) => {
    const slotId = `${actualPrefix}${i + 1}`;
    let status = slotStatusMap[slotId] || 'available';
    if (lockedSlots.includes(slotId)) status = 'locked';

    return {
      id: slotId,
      status,
      isBest:
        prefix === 'A' &&
        ((level === 1 && i === 2) || (level === 2 && i === 4) || (level === 3 && i === 1)) &&
        status === 'available',
    };
  });
};

export const countByStatus = (slots: ParkingSlot[], s: SlotStatus) =>
  slots.filter((sl) => sl.status === s).length;

const DEFAULT_LOTS = [
  { id: 1, name: 'Landmark 81 - Bãi đỗ A1', floor: 'Tầng 1', block: 'Block A' },
  { id: 2, name: 'Bitexco Financial - Bãi đỗ B2', floor: 'Tầng 2', block: 'Block B' },
  { id: 3, name: 'Vincom Center - Bãi đỗ V3', floor: 'Hầm B3', block: 'Block V' },
  { id: 4, name: 'Saigon Centre - Bãi đỗ S1', floor: 'Tầng 4', block: 'Block S' },
  { id: 5, name: 'Lotte Mart Q7 - Bãi đỗ L1', floor: 'Hầm B1', block: 'Block L' },
  { id: 6, name: 'Crescent Mall Q7 - Bãi đỗ C1', floor: 'Tầng G', block: 'Block C' },
  { id: 7, name: 'Sân bay Tân Sơn Nhất - Block A', floor: 'Ga quốc tế', block: 'Khu vực A' },
];

export function useParkingStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const { parkingLots: fetchedLots, setParkingLots, fetchParkingLots } = useParkingLots({
    autoFetch: false,
  });

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showReservePrompt, setShowReservePrompt] = useState(false);
  const [showActiveSessionWarning, setShowActiveSessionWarning] = useState(false);
  const [slotStatusMap, setSlotStatusMap] = useState<Record<string, SlotStatus>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedParking, setSelectedParking] = useState(
    location.state?.selectedParking ||
      JSON.parse(localStorage.getItem('selectedParking') || 'null') ||
      DEFAULT_LOTS[0],
  );

  useMySession({
    requireAuth: false,
    onCleared: () => setShowActiveSessionWarning(false),
  });

  const parkingLots = fetchedLots.length > 0 ? fetchedLots : DEFAULT_LOTS;
  const floors = selectedParking.floors || [1, 2, 3];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    void fetchParkingLots().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setParkingLots(data);
      }
    });
  }, [fetchParkingLots, setParkingLots]);

  useEffect(() => {
    if (selectedParking.floor?.includes('Tầng')) {
      const n = parseInt(selectedParking.floor.replace('Tầng ', ''));
      if (!isNaN(n) && n <= 3) setSelectedLevel(n);
    }
  }, [selectedParking.floor]);

  useEffect(() => {
    const fetchStatus = () => {
      parkingService
        .getSlotsStatus(selectedParking.name)
        .then((res) => {
          if (res.data) setSlotStatusMap(res.data);
        })
        .catch((err) => console.error('Error fetching slot status map', err));

      void fetchParkingLots().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setParkingLots(data);
          setSelectedParking((prev: any) => {
            const updated = data.find((l: any) => l.id === prev?.id);
            if (updated) {
              localStorage.setItem('selectedParking', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [selectedParking.name, fetchParkingLots, setParkingLots]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedLevel]);

  const currentFloorCapacity =
    selectedParking.floorCapacities?.[selectedLevel.toString()] || selectedParking.capacity || 24;
  const capacityHalf = Math.floor(currentFloorCapacity / 2);
  const westSlots = generateSlots(
    'A',
    capacityHalf,
    selectedLevel,
    slotStatusMap,
    selectedParking.lockedSlots || [],
  );
  const eastSlots = generateSlots(
    'B',
    capacityHalf,
    selectedLevel,
    slotStatusMap,
    selectedParking.lockedSlots || [],
  );
  const allSlots = [...westSlots, ...eastSlots];
  const availableCount = countByStatus(allSlots, 'available');
  const occupiedCount = countByStatus(allSlots, 'occupied');

  const getSlotCoords = (slotId: string) => {
    const prefix = slotId.charAt(0);
    const num = parseInt(slotId.substring(1));
    const isWest = prefix.charCodeAt(0) % 2 !== 0;

    const rowSize = Math.floor(capacityHalf / 2);
    const isRow1 = num <= rowSize;
    const colIndex = isRow1 ? num - 1 : num - rowSize - 1;

    let slotWidth = 40;
    let spacing = 52;

    const availableWidth = 290;
    if (rowSize * spacing > availableWidth) {
      spacing = Math.floor(availableWidth / Math.max(1, rowSize));
      slotWidth = Math.max(16, spacing - (spacing > 25 ? 6 : 2));
    }

    const startX = 40;
    const eastStartX = 760 - ((rowSize - 1) * spacing + slotWidth);

    const x = isWest ? startX + colIndex * spacing : eastStartX + colIndex * spacing;
    const y = isRow1 ? 80 : 350;
    const centerX = x + slotWidth / 2;
    const centerY = y + 35;

    return { x, y, centerX, centerY, isRow1, isWest, slotWidth };
  };

  const handleSlotClick = (id: string) => {
    if (slotStatusMap[id] === 'reserved') {
      showToast('Vị trí này đã có người đặt trước!', 'error');
      return;
    }
    setSelectedSlot((prev) => {
      const newSlot = prev === id ? null : id;
      if (newSlot) {
        localStorage.setItem('selectedSlot', newSlot);
        localStorage.setItem('selectedLevel', selectedLevel.toString());
      } else {
        localStorage.removeItem('selectedSlot');
      }
      return newSlot;
    });
  };

  const selectParkingLot = (lot: any) => {
    setSelectedParking(lot);
    localStorage.setItem('selectedParking', JSON.stringify(lot));
    setIsDropdownOpen(false);
    setSelectedSlot(null);
  };

  const confirmSelectedSlot = () => {
    const bypassActiveCheck = location.state?.bypassActiveCheck || false;
    const isActive = hasActiveSessions();
    if (isActive && !bypassActiveCheck) {
      setShowActiveSessionWarning(true);
      return;
    }

    localStorage.setItem('selectedSlot', selectedSlot || 'A3');
    localStorage.setItem('selectedLevel', selectedLevel.toString());

    if (location.state?.fromReserve) {
      navigate('/payment', { state: { mode: 'reserve' } });
    } else {
      navigate('/reserve', { state: { fromStatus: true } });
    }
  };

  const goToReserveFromPrompt = () => {
    setShowReservePrompt(false);
    localStorage.setItem('selectedSlot', selectedSlot || 'A3');
    localStorage.setItem('selectedLevel', selectedLevel.toString());
    navigate('/reserve', { state: { fromStatus: true } });
  };

  return {
    navigate,
    location,
    selectedLevel,
    setSelectedLevel,
    selectedSlot,
    showReservePrompt,
    setShowReservePrompt,
    showActiveSessionWarning,
    setShowActiveSessionWarning,
    slotStatusMap,
    toast,
    setToast,
    parkingLots,
    selectedParking,
    floors,
    isDropdownOpen,
    setIsDropdownOpen,
    westSlots,
    eastSlots,
    availableCount,
    occupiedCount,
    getSlotCoords,
    handleSlotClick,
    selectParkingLot,
    confirmSelectedSlot,
    goToReserveFromPrompt,
  };
}
