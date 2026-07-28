import { useEffect, useState } from 'react';
import { parkingService } from '../services/parking.service';
import { useParkingLots } from './useParkingLots';
import { useParkingSessions } from './useParkingSessions';
import { useToast } from './useToast';

export function useAdminReports() {
  const { fetchParkingLots } = useParkingLots({ autoFetch: false });
  const { fetchSessions } = useParkingSessions({ autoFetch: false });
  const { toastMessage, showToast } = useToast();

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalStats, setGlobalStats] = useState({
    totalCapacity: 0,
    currentOccupancy: 0,
    totalRevenue: 0,
    totalSessions: 0,
  });
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    { month: string; revenue: number }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [newLotAddress, setNewLotAddress] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');
  const [newLotFloors, setNewLotFloors] = useState<number[]>([1, 2, 3]);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newLot, setNewLot] = useState({
    name: '',
    floor: 'Tầng 1',
    block: 'Block A',
    latitude: '10.7717',
    longitude: '106.7044',
    capacity: 24,
  });
  const [newLotFloorCapacities, setNewLotFloorCapacities] = useState<Record<string, number>>({});

  const fetchRealData = async () => {
    try {
      const [lots, sessions] = await Promise.all([fetchParkingLots(), fetchSessions()]);

      let gCapacity = 0;
      let gOccupancy = 0;
      let gRevenue = 0;
      let gSessions = 0;

      const enhancedLots = lots.map((lot: any) => {
        const lotSessions = sessions.filter(
          (s: any) => s.parkingLotId === lot.id || s.parkingLotName === lot.name || s.ParkingLotName === lot.name
        );

        const activeSessions = lotSessions.filter(
          (s: any) => s.isCheckedIn && s.status !== 'Completed' && s.status !== 'Cancelled'
        );
        const currentOccupancy = activeSessions.length;

        const completedSessions = lotSessions.filter((s: any) => s.status === 'Completed');
        const revenue = completedSessions.reduce(
          (sum: number, s: any) => sum + (s.totalFee || 0),
          0
        );

        const activeFloors = lot.floors && lot.floors.length > 0 ? lot.floors : [1];
        const trueCapacity =
          lot.floorCapacities && Object.keys(lot.floorCapacities).length > 0
            ? activeFloors.reduce(
                (sum: number, f: number) => sum + (lot.floorCapacities[f.toString()] || 24),
                0
              )
            : lot.capacity || 24;

        gCapacity += trueCapacity;
        gOccupancy += currentOccupancy;
        gRevenue += revenue;
        gSessions += lotSessions.length;

        return {
          ...lot,
          capacity: trueCapacity,
          currentOccupancy,
          totalSessions: lotSessions.length,
          totalRevenue: revenue,
        };
      });

      const currentYear = new Date().getFullYear();
      const monthlyTotals = Array(12).fill(0);

      sessions.forEach((s: any) => {
        if (s.status === 'Completed' && s.totalFee) {
          const exitDate = new Date(s.exitTime || s.createdAt);
          if (exitDate.getFullYear() === currentYear) {
            monthlyTotals[exitDate.getMonth()] += s.totalFee;
          }
        }
      });

      setMonthlyRevenueData(
        monthlyTotals.map((val, index) => ({
          month: `Th.${index + 1}`,
          revenue: val,
        }))
      );

      setGlobalStats({
        totalCapacity: gCapacity,
        currentOccupancy: gOccupancy,
        totalRevenue: gRevenue,
        totalSessions: gSessions,
      });

      setBranches(enhancedLots);
    } catch (error) {
      console.error('Error fetching real data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRealData();
  }, []);

  useEffect(() => {
    if (newLotAddress.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLotAddress)}&limit=5`
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setAddressSuggestions(data);
        }
      } catch (e) {
        console.error('Suggestions fetch error:', e);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newLotAddress]);

  const handleSelectSuggestion = (item: any) => {
    const lat = item.lat;
    const lon = item.lon;
    const fullAddress = item.display_name;

    setNewLotAddress(fullAddress);
    setNewLot((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
    }));

    setSearchFeedback('Đã định vị thành công!');
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchAddress = async () => {
    if (!newLotAddress.trim()) return;
    setIsSearchingLocation(true);
    setSearchFeedback('Đang tìm vị trí...');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLotAddress)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setNewLot((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
        setSearchFeedback('Đã định vị thành công!');
      } else {
        setSearchFeedback('Không tìm thấy địa điểm. Hãy thử địa chỉ khác.');
      }
    } catch (e) {
      setSearchFeedback('Lỗi kết nối bản đồ. Hãy thử lại.');
      console.error(e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLot.name.trim()) return;

    try {
      await parkingService.createParkingLot({
        name: newLot.name,
        latitude: newLot.latitude,
        longitude: newLot.longitude,
        floor: newLot.floor,
        block: newLot.block,
        capacity: newLot.capacity,
        floorCapacities: newLotFloorCapacities,
        floors: [...newLotFloors],
      });
      await fetchRealData();
    } catch (error) {
      console.error('Error adding parking lot:', error);
    }

    setNewLot({
      name: '',
      floor: 'Tầng 1',
      block: 'Block A',
      latitude: '10.7717',
      longitude: '106.7044',
      capacity: 24,
    });
    setNewLotAddress('');
    setSearchFeedback('');
    setNewLotFloors([1, 2, 3]);
    setNewLotFloorCapacities({});
    showToast('Thêm chi nhánh mới thành công!', 'success');
  };

  const handleDeleteLot = async (id: any) => {
    try {
      await parkingService.deleteParkingLot(id);
      await fetchRealData();
      showToast('Đã xóa chi nhánh thành công!', 'info');
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      showToast('Xóa chi nhánh thất bại!', 'error');
    }
  };

  const handleAddFloorToLot = async (id: any) => {
    const lot = branches.find((p) => p.id === id);
    if (!lot) return;
    const currentFloors = lot.floors || [1, 2, 3];

    let nextFloor = 1;
    while (currentFloors.includes(nextFloor)) {
      nextFloor++;
    }

    const updatedFloors = [...currentFloors, nextFloor].sort((a, b) => a - b);

    const updatedCaps = { ...(lot.floorCapacities || {}) };
    updatedCaps[nextFloor.toString()] = 24;

    try {
      await parkingService.updateParkingLot(id, {
        ...lot,
        floors: updatedFloors,
        floorCapacities: updatedCaps,
      });
      await fetchRealData();
      showToast('Đã thêm tầng mới thành công!', 'success');
    } catch (error) {
      console.error('Error adding floor:', error);
      showToast('Thêm tầng thất bại!', 'error');
    }
  };

  const handleRemoveFloorFromLot = async (id: any, floorToRemove: number) => {
    const lot = branches.find((p) => p.id === id);
    if (!lot) return;
    const currentFloors = lot.floors || [1, 2, 3];
    const updatedFloors = currentFloors.filter((f: number) => f !== floorToRemove);

    const updatedCaps = { ...(lot.floorCapacities || {}) };
    delete updatedCaps[floorToRemove.toString()];

    try {
      await parkingService.updateParkingLot(id, {
        ...lot,
        floors: updatedFloors,
        floorCapacities: updatedCaps,
      });
      await fetchRealData();
      showToast('Đã xóa tầng thành công!', 'info');
    } catch (error) {
      console.error('Error removing floor:', error);
      showToast('Xóa tầng thất bại!', 'error');
    }
  };

  const handleFloorCapacityChange = (id: any, floorNumber: number, newCapacity: number) => {
    setBranches((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const caps = { ...(p.floorCapacities || {}) };
          caps[floorNumber.toString()] = newCapacity;
          return { ...p, floorCapacities: caps };
        }
        return p;
      })
    );
  };

  const handleFloorCapacityBlur = async (id: any) => {
    const lot = branches.find((p) => p.id === id);
    if (!lot) return;
    try {
      await parkingService.updateParkingLot(id, lot);
      showToast('Cập nhật số ô thành công!', 'success');
    } catch (error) {
      console.error('Error updating capacity:', error);
      showToast('Cập nhật số ô thất bại!', 'error');
      void fetchRealData();
    }
  };

  const handleFieldChange = (id: any, field: string, value: string) => {
    setBranches((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleCoordinatesChange = (id: any, value: string) => {
    const parts = value.split(',');
    const lat = parts[0]?.trim() || '';
    const lng = parts[1]?.trim() || '';
    setBranches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, latitude: lat, longitude: lng, _tempCoords: value } : p))
    );
  };

  const handleFieldBlur = async (id: any) => {
    const lot = branches.find((p) => p.id === id);
    if (!lot) return;
    try {
      await parkingService.updateParkingLot(id, lot);
      showToast('Cập nhật thông tin thành công!', 'success');
    } catch (error) {
      console.error('Error updating lot info:', error);
      showToast('Cập nhật thông tin thất bại!', 'error');
      void fetchRealData();
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    branches,
    loading,
    searchQuery,
    setSearchQuery,
    globalStats,
    monthlyRevenueData,
    searchTerm,
    setSearchTerm,
    toastMessage,
    showToast,
    newLotAddress,
    setNewLotAddress,
    isSearchingLocation,
    searchFeedback,
    setSearchFeedback,
    newLotFloors,
    setNewLotFloors,
    addressSuggestions,
    showSuggestions,
    setShowSuggestions,
    newLot,
    setNewLot,
    newLotFloorCapacities,
    setNewLotFloorCapacities,
    filteredBranches,
    handleSelectSuggestion,
    handleSearchAddress,
    handleAddLot,
    handleDeleteLot,
    handleAddFloorToLot,
    handleRemoveFloorFromLot,
    handleFloorCapacityChange,
    handleFloorCapacityBlur,
    handleFieldChange,
    handleCoordinatesChange,
    handleFieldBlur,
  };
}
