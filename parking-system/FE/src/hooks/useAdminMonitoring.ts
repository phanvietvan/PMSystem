import { useEffect, useState } from 'react';
import { parkingService } from '../services/parking.service';
import { useParkingLots } from './useParkingLots';
import { useParkingSessions } from './useParkingSessions';
import { useToast } from './useToast';

const DEFAULT_LOTS = [
  { id: 1, name: 'Landmark 81 - Bãi đỗ A1', floor: 'Tầng 1', block: 'Block A', capacity: 24 },
  { id: 2, name: 'Bitexco Financial - Bãi đỗ B2', floor: 'Tầng 2', block: 'Block B', capacity: 24 },
  { id: 3, name: 'Vincom Center - Bãi đỗ V3', floor: 'Hầm B3', block: 'Block V', capacity: 18 },
];

function enhanceLots(lots: any[]) {
  return lots.map((l) => {
    const activeFloors = l.floors && l.floors.length > 0 ? l.floors : [1];
    const trueCapacity =
      l.floorCapacities && Object.keys(l.floorCapacities).length > 0
        ? activeFloors.reduce(
            (sum: number, f: number) => sum + (l.floorCapacities[f.toString()] || 24),
            0
          )
        : l.capacity || 24;
    return { ...l, capacity: trueCapacity };
  });
}

export function useAdminMonitoring() {
  const { setParkingLots: _setSharedLots, fetchParkingLots } = useParkingLots({ autoFetch: false });
  const { fetchSessions } = useParkingSessions({ autoFetch: false });
  const { toastMessage, setToastMessage, showToast: showToastBase } = useToast();

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [parkingLots, setParkingLots] = useState<any[]>(DEFAULT_LOTS);
  const [selectedLot, setSelectedLot] = useState<any>(DEFAULT_LOTS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [actionModalSlot, setActionModalSlot] = useState<string | null>(null);
  const [actionModalStatus, setActionModalStatus] = useState<string>('');
  const [actionModalSession, setActionModalSession] = useState<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [newSlotInput, setNewSlotInput] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    showToastBase(message, type);
  };

  const toast = toastMessage
    ? { message: toastMessage.text, type: toastMessage.type as 'success' | 'error' }
    : null;

  const applyLots = (rawLots: any[]) => {
    if (!rawLots || !Array.isArray(rawLots) || rawLots.length === 0) return;
    const lots = enhanceLots(rawLots);
    setParkingLots(lots);
    _setSharedLots(lots);
    setSelectedLot((prev: any) => {
      const updated = lots.find((l: any) => l.id === prev?.id);
      if (updated) {
        localStorage.setItem('selectedLot', JSON.stringify(updated));
        return updated;
      }
      return lots.find((l: any) => l.id === prev?.id) || lots[0] || prev;
    });
  };

  const applyActiveSessions = (sessions: any[]) => {
    setActiveSessions(sessions.filter((s: any) => s.status === 'Active'));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessions, lots] = await Promise.all([fetchSessions(), fetchParkingLots()]);
        applyLots(lots);
        applyActiveSessions(sessions);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      }
    };

    void fetchData();
    const interval = setInterval(() => {
      fetchSessions()
        .then((sessions) => applyActiveSessions(sessions))
        .catch((err) => console.error(err));

      fetchParkingLots()
        .then((lots) => applyLots(lots))
        .catch((err) => console.error(err));
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchSessions, fetchParkingLots]);

  const getLotStats = (lotName: string) => {
    const sessions = activeSessions.filter((s) => s.parkingLotName === lotName);
    const occupied = sessions.filter((s) => s.isCheckedIn).length;
    const reserved = sessions.filter((s) => !s.isCheckedIn).length;
    return { occupied, reserved, total: sessions.length };
  };

  const currentLotStats = getLotStats(selectedLot.name);
  const currentLotSessions = activeSessions.filter(
    (s) => s.parkingLotName === selectedLot.name
  );

  const getSlotStatus = (slotName: string) => {
    if (selectedLot.lockedSlots?.includes(slotName)) return 'locked';

    const exactSession = currentLotSessions.find((s) => s.parkingSlot === slotName);
    if (exactSession) return exactSession.isCheckedIn ? 'occupied' : 'reserved';

    return 'available';
  };

  const getSlotSession = (slotName: string) => {
    const exactSession = currentLotSessions.find((s) => s.parkingSlot === slotName);
    if (exactSession) return exactSession;
    return undefined;
  };

  const handleSlotClick = (slotId: string, status: string, session: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActionModalSlot(slotId);
    setActionModalStatus(status);
    setActionModalSession(session);
    setNewSlotInput('');
    setShowUserInfo(false);
    setShowActionModal(true);
  };

  const performLockToggle = async () => {
    if (!actionModalSlot) return;
    const isLocked = actionModalStatus === 'locked';
    try {
      if (isLocked) {
        await parkingService.unlockSlot(selectedLot.id, actionModalSlot);
      } else {
        await parkingService.lockSlot(selectedLot.id, actionModalSlot);
      }
      const updatedLockedSlots = isLocked
        ? (selectedLot.lockedSlots || []).filter((id: string) => id !== actionModalSlot)
        : [...(selectedLot.lockedSlots || []), actionModalSlot];

      const updatedLot = { ...selectedLot, lockedSlots: updatedLockedSlots };
      setSelectedLot(updatedLot);
      setParkingLots(parkingLots.map((l) => (l.id === selectedLot.id ? updatedLot : l)));
      setShowActionModal(false);
      showToast(isLocked ? 'Đã mở khóa vị trí thành công' : 'Đã khóa vị trí thành công');
    } catch (err: any) {
      console.error('Error toggling slot lock:', err);
      showToast('Lỗi: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleCancelSession = async () => {
    const sessionId = actionModalSession?.id || actionModalSession?.Id;
    if (!sessionId) return showToast('Lỗi: Không tìm thấy ID phiên.', 'error');
    if (!confirm('Bạn có chắc chắn muốn hủy phiên đặt chỗ này?')) return;
    try {
      await parkingService.cancelSession(sessionId);
      showToast('Hủy chỗ thành công!');
      setShowActionModal(false);
      const sessions = await fetchSessions();
      applyActiveSessions(sessions);
    } catch (err: any) {
      showToast('Lỗi khi hủy: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleChangeSlot = async () => {
    if (!newSlotInput.trim()) return showToast('Vui lòng nhập vị trí mới (VD: B5).', 'error');
    const sessionId = actionModalSession?.id || actionModalSession?.Id;
    if (!sessionId) return showToast('Lỗi: Không tìm thấy ID phiên.', 'error');
    try {
      await parkingService.changeSlot(sessionId, {
        newSlot: newSlotInput.trim().toUpperCase(),
      });
      showToast('Đổi vị trí thành công!');
      setShowActionModal(false);
      const sessions = await fetchSessions();
      applyActiveSessions(sessions);
    } catch (err: any) {
      showToast(
        'Lỗi khi đổi vị trí: ' + (err.response?.data?.message || err.message),
        'error'
      );
    }
  };

  return {
    activeSessions,
    parkingLots,
    selectedLot,
    setSelectedLot,
    isDropdownOpen,
    setIsDropdownOpen,
    selectedLevel,
    setSelectedLevel,
    actionModalSlot,
    actionModalStatus,
    actionModalSession,
    showActionModal,
    setShowActionModal,
    showUserInfo,
    setShowUserInfo,
    newSlotInput,
    setNewSlotInput,
    toast,
    setToast: setToastMessage,
    showToast,
    getLotStats,
    currentLotStats,
    currentLotSessions,
    getSlotStatus,
    getSlotSession,
    handleSlotClick,
    performLockToggle,
    handleCancelSession,
    handleChangeSlot,
  };
}
