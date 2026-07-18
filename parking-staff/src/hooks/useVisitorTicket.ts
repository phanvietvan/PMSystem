import { useState, useEffect } from 'react';
import { parkingService } from '../services/parking.service';
import { playChimeSound } from '../utils/audio';

const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

export const useVisitorTicket = (
  selectedParkingLot: string,
  fetchRecentSessions: () => Promise<void>,
  captureFrame: () => string | null
) => {
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorSnapshot, setVisitorSnapshot] = useState<string | null>(null);
  const [visitorPlate, setVisitorPlate] = useState('');
  const [visitorVehicleType, setVisitorVehicleType] = useState('Car');
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (generatedTicket?.qrCode) {
      import('qrcode').then(({ default: QRCode }) => {
        QRCode.toDataURL(generatedTicket.qrCode, { width: 200, margin: 1 }, (err, url) => {
          if (!err && url) {
            setTicketQrDataUrl(url);
          }
        });
      });
    } else {
      setTicketQrDataUrl('');
    }
  }, [generatedTicket]);

  const handleCreateVisitorTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorPlate.trim()) return;

    setIsGeneratingTicket(true);
    playChimeSound();

    const plateNormalized = visitorPlate.trim().toUpperCase();
    const livePhoto =
      visitorSnapshot ||
      captureFrame() ||
      FALLBACK_CAR_CAPTURES[Math.floor(Math.random() * FALLBACK_CAR_CAPTURES.length)];

    try {
      const data = await parkingService.checkin({
        licensePlate: plateNormalized,
        entryPhoto: livePhoto,
        parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
        vehicleType: visitorVehicleType,
      });

      setGeneratedTicket({
        qrCode: data.qrCode,
        plate: data.licensePlate,
        time: new Date(data.entryTime).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        photo: data.entryPhoto || livePhoto,
        vehicleType: data.vehicleType,
        parkingLotName: data.parkingLotName || selectedParkingLot || 'Khu Vực A (Vãng lai)',
      });
      fetchRecentSessions();
    } catch (err) {
      console.warn('Failed to checkin via database, falling back to local simulation:', err);
      const mockQrCode = `QR_VIS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setGeneratedTicket({
        qrCode: mockQrCode,
        plate: plateNormalized,
        time: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        photo: livePhoto,
        vehicleType: visitorVehicleType,
        parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
      });
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  return {
    showVisitorModal,
    setShowVisitorModal,
    visitorSnapshot,
    setVisitorSnapshot,
    visitorPlate,
    setVisitorPlate,
    visitorVehicleType,
    setVisitorVehicleType,
    generatedTicket,
    setGeneratedTicket,
    isGeneratingTicket,
    ticketQrDataUrl,
    setTicketQrDataUrl,
    handleCreateVisitorTicket,
  };
};
