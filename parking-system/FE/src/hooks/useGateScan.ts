import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveQrs } from '../utils/auth';
import { parkingService } from '../services/parking.service';

export function useGateScan() {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success'>('idle');

  const handleScan = async () => {
    setScanStatus('scanning');
    try {
      const qrs = getActiveQrs();
      const activeQr = qrs.length > 0 ? qrs[qrs.length - 1] : null;

      if (activeQr) {
        await parkingService.gateScan({ qrCode: activeQr });
      } else {
        const storedParking = localStorage.getItem('selectedParking');
        let selectedParkingName = 'Landmark 81 - Bãi đỗ A1';
        if (storedParking) {
          try {
            selectedParkingName = JSON.parse(storedParking).name;
          } catch {
            /* ignore */
          }
        }
        const storedSlot = localStorage.getItem('selectedSlot') || 'A8';
        const storedVehicleType = localStorage.getItem('reservationVehicleType') || 'car';
        const storedLicensePlate =
          localStorage.getItem('reservationLicensePlate') || '51G-888.88';

        const response = await parkingService.checkin({
          licensePlate: storedLicensePlate,
          entryPhoto: '',
          parkingLotName: selectedParkingName,
          vehicleType: storedVehicleType,
          parkingSlot: storedSlot,
        });

        const returnedQr = response.data.qrCode || response.data.QrCode;
        if (returnedQr) {
          const { addActiveQr } = await import('../utils/auth');
          addActiveQr(returnedQr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setScanStatus('success');
      setTimeout(() => navigate('/navigation'), 2000);
    } catch (err) {
      console.error('Gate scan API error', err);
      setScanStatus('success');
      setTimeout(() => navigate('/navigation'), 2000);
    }
  };

  return { scanStatus, handleScan };
}
