import { useState, useEffect } from 'react';
import { parkingService } from '../services/parking.service';
import type { ParkingLot } from '../types/ParkingLot';

export const useParkingLots = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedParkingLot, setSelectedParkingLot] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState(200);

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const data = await parkingService.getParkingLots();
        setParkingLots(data);
        const totalCap = data.reduce((sum: number, lot: ParkingLot) => sum + (lot.capacity || 50), 0);
        setMaxCapacity(totalCap > 0 ? totalCap : 200);
        if (data && data.length > 0) {
          setSelectedParkingLot(data[0].name);
        }
      } catch (err) {
        console.error('Failed to fetch parking lots', err);
      }
    };
    fetchParkingLots();
  }, []);

  return {
    parkingLots,
    setParkingLots,
    selectedParkingLot,
    setSelectedParkingLot,
    maxCapacity,
    setMaxCapacity,
  };
};
