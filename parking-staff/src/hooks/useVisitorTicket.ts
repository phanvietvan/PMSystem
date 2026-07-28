import { useState, useEffect } from 'react';
import { parkingService } from '../services/parking.service';
import { playChimeSound } from '../utils/audio';
import { formatVnDateTime } from '../utils/datetime';

export const useVisitorTicket = (
  selectedParkingLot: string,
  fetchRecentSessions: () => Promise<void>,
  captureFrame: () => string | null,
  parkingLots?: { id?: string; name?: string }[]
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
    const livePhoto = visitorSnapshot || captureFrame();
    if (!livePhoto || String(livePhoto).startsWith('http')) {
      setIsGeneratingTicket(false);
      alert('Không chụp được ảnh camera. Cho phép quyền camera rồi thử lại.');
      return;
    }

    try {
      const selectedLot = parkingLots?.find((p) => p.name === selectedParkingLot);
      const data = await parkingService.checkin({
        licensePlate: plateNormalized,
        entryPhoto: livePhoto,
        parkingLotName: selectedParkingLot || 'Khu Vực A (Vãng lai)',
        parkingLotId: selectedLot?.id,
        vehicleType: visitorVehicleType,
      });

      setGeneratedTicket({
        qrCode: data.qrCode,
        plate: data.licensePlate,
        time: formatVnDateTime(data.entryTime),
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
        time: formatVnDateTime(new Date()),
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
