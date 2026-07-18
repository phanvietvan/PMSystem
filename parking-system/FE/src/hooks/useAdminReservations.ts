import { useEffect, useMemo, useState } from 'react';
import { parkingService } from '../services/parking.service';
import { useParkingSessions } from './useParkingSessions';

const ITEMS_PER_PAGE = 10;

export function useAdminReservations() {
  const { sessions, setSessions, loading, fetchSessions } = useParkingSessions({
    autoFetch: true,
    pollIntervalMs: 5000,
  });

  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  const [newEndTime, setNewEndTime] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  // Sort newest first (match previous page behavior)
  const reservations = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.entryTime).getTime();
      const timeB = new Date(b.createdAt || b.entryTime).getTime();
      return timeB - timeA;
    });
  }, [sessions]);

  const statusOptions = [
    { value: 'All', label: 'Tất cả trạng thái' },
    { value: 'Waiting', label: 'Chờ vào bãi' },
    { value: 'Parking', label: 'Đang đỗ xe' },
    { value: 'Completed', label: 'Đã hoàn tất' },
    { value: 'Cancelled', label: 'Đã hủy' },
  ];

  const vehicleOptions = [
    { value: 'All', label: 'Tất cả các loại' },
    { value: 'car', label: 'Ô tô (Car)' },
    { value: 'suv', label: 'Bán tải / SUV' },
    { value: 'bike', label: 'Xe máy (Bike)' },
  ];

  const locationOptions = [
    { value: 'All', label: 'Tất cả khu vực' },
    ...Array.from(new Set(reservations.map((r) => r.parkingLotName).filter(Boolean))).map(
      (loc) => ({
        value: loc as string,
        label: loc as string,
      })
    ),
  ];

  const handleOpenModal = (row: any) => {
    setSelectedReservation(row);
    setNewEndTime(row.reservationEndTime || '');
    setExtensionError(null);
    setIsModalOpen(true);
  };

  const handleExtend = async () => {
    if (!newEndTime) return;
    setIsExtending(true);
    setExtensionError(null);
    try {
      const response = await parkingService.extendSession(selectedReservation.id, {
        newEndTime: newEndTime,
      });

      const updatedSession = response.data?.session || response.data;
      if (updatedSession) {
        setSessions((prev: any[]) =>
          prev.map((r: any) =>
            r.id === selectedReservation.id ? { ...r, ...updatedSession } : r
          )
        );
        setSelectedReservation((prev: any) => ({ ...prev, ...updatedSession }));
      }

      alert('Gia hạn thời gian đỗ xe thành công!');
    } catch (error: any) {
      console.error('Failed to extend session:', error);
      const errMsg = error.response?.data?.message || error.message || 'Gia hạn thất bại';
      setExtensionError(errMsg);
    } finally {
      setIsExtending(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    let matchSearch = true;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const qr = (r.qrCode || '').toLowerCase();
      const id = (r.id || '').substring(0, 8).toLowerCase();
      const plate = (r.licensePlate || '').toLowerCase();
      const exitPlate = (r.exitLicensePlate || '').toLowerCase();
      const userName = r.user
        ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim().toLowerCase()
        : 'khách vãng lai';
      const email = (r.user?.email || '').toLowerCase();
      const phone = (r.user?.phoneNumber || '').toLowerCase();
      const location = (r.parkingLotName || '').toLowerCase();
      const vehicle = (r.vehicleType || '').toLowerCase();

      matchSearch =
        qr.includes(term) ||
        id.includes(term) ||
        plate.includes(term) ||
        exitPlate.includes(term) ||
        userName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        location.includes(term) ||
        vehicle.includes(term);
    }

    let matchStatus = true;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Completed') matchStatus = r.status === 'Completed';
      else if (statusFilter === 'Cancelled') matchStatus = r.status === 'Cancelled';
      else if (statusFilter === 'Waiting')
        matchStatus = r.status !== 'Completed' && r.status !== 'Cancelled' && !r.isCheckedIn;
      else if (statusFilter === 'Parking')
        matchStatus = r.status !== 'Completed' && r.status !== 'Cancelled' && r.isCheckedIn;
    }

    let matchVehicle = true;
    if (vehicleFilter !== 'All') {
      const vType = (r.vehicleType || '').toLowerCase();
      if (vehicleFilter === 'car') matchVehicle = vType === 'car';
      else if (vehicleFilter === 'bike') matchVehicle = vType === 'bike';
      else if (vehicleFilter === 'suv') matchVehicle = vType === 'suv';
    }

    let matchLocation = true;
    if (locationFilter !== 'All') {
      matchLocation = r.parkingLotName === locationFilter;
    }

    return matchSearch && matchStatus && matchVehicle && matchLocation;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, vehicleFilter, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / ITEMS_PER_PAGE));
  const currentReservations = filteredReservations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredReservations.length);

  const totalReservations = reservations.length;
  const pendingCount = reservations.filter(
    (r) => !r.isCheckedIn && r.status !== 'Completed' && r.status !== 'Cancelled'
  ).length;
  const completedCount = reservations.filter((r) => r.status === 'Completed').length;
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalFee || 0), 0);

  return {
    reservations,
    loading,
    selectedReservation,
    setSelectedReservation,
    isModalOpen,
    setIsModalOpen,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    isFilterOpen,
    setIsFilterOpen,
    statusFilter,
    setStatusFilter,
    vehicleFilter,
    setVehicleFilter,
    locationFilter,
    setLocationFilter,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    isVehicleDropdownOpen,
    setIsVehicleDropdownOpen,
    isLocationDropdownOpen,
    setIsLocationDropdownOpen,
    newEndTime,
    setNewEndTime,
    isExtending,
    extensionError,
    statusOptions,
    vehicleOptions,
    locationOptions,
    filteredReservations,
    currentReservations,
    totalPages,
    startIndex,
    endIndex,
    totalReservations,
    pendingCount,
    completedCount,
    totalRevenue,
    ITEMS_PER_PAGE,
    handleOpenModal,
    handleExtend,
    fetchSessions,
  };
}
