import { useState, useEffect } from 'react';
import { parkingService } from '../services/parking.service';
import type { ParkingSession, ParkingSessionRaw } from '../types/ParkingSession';

const FALLBACK_CAR_CAPTURES = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
];

export const useParkingSessions = () => {
  const [recentLogs, setRecentLogs] = useState<ParkingSession[]>([]);
  const [currentOccupied, setCurrentOccupied] = useState(0);

  const fetchRecentSessions = async () => {
    try {
      const data = await parkingService.getParkingSessions();
      const mapped = data.map((session: ParkingSessionRaw): ParkingSession => {
        const createdDateObj = session.createdAt ? new Date(session.createdAt) : new Date(session.entryTime);
        const createdTimeStr = createdDateObj.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const createdDateStr = createdDateObj.toLocaleDateString('vi-VN');

        const entryDateObj = new Date(session.entryTime);
        const timeStr = entryDateObj.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const dateStr = entryDateObj.toLocaleDateString('vi-VN');

        let exitTimeStr = '';
        let exitDateStr = '';
        if (session.exitTime) {
          const exitDateObj = new Date(session.exitTime);
          exitTimeStr = exitDateObj.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          exitDateStr = exitDateObj.toLocaleDateString('vi-VN');
        }

        let dynamicTicketStatus = '';
        if (session.status === 'Completed') dynamicTicketStatus = 'Đã hoàn tất (Đã ra)';
        else if (session.status === 'Active') {
          dynamicTicketStatus = session.userId
            ? session.isCheckedIn
              ? 'Đang gửi trong bãi'
              : 'Đã đặt chỗ (Chưa vào)'
            : 'Đang gửi trong bãi';
        } else {
          dynamicTicketStatus = session.status;
        }

        return {
          plate: session.licensePlate,
          status: session.status === 'Completed' ? 'Lối ra' : 'Lối vào',
          time: session.status === 'Completed' && session.exitTime ? exitTimeStr : timeStr,
          createdTimeStr: createdTimeStr,
          createdDateStr: createdDateStr,
          entryTimeStr: timeStr,
          entryDateStr: dateStr,
          exitTimeStr: exitTimeStr,
          exitDateStr: exitDateStr,
          isCheckedIn: session.isCheckedIn,
          type:
            session.status === 'Cancelled'
              ? 'CANCELLED'
              : session.status === 'Completed'
              ? 'EXIT'
              : session.userId && !session.isCheckedIn
              ? 'PENDING'
              : 'ENTRY',
          owner: session.userId ? 'KHÁCH ĐẶT TRƯỚC' : 'KHÁCH VÃNG LAI',
          ticketType: dynamicTicketStatus,
          customerName: session.user ? `${session.user.lastName} ${session.user.firstName}`.trim() : null,
          customerPhone: session.user ? session.user.phoneNumber || null : null,
          customerEmail: session.user ? session.user.email || null : null,
          photo:
            session.status === 'Completed'
              ? session.exitPhoto || session.entryPhoto || FALLBACK_CAR_CAPTURES[0]
              : session.entryPhoto || FALLBACK_CAR_CAPTURES[0],
          entryPhoto: session.entryPhoto,
          exitPhoto: session.exitPhoto,
          qrCode: session.qrCode,
          totalFee: session.totalFee,
          parkingLotName: session.parkingLotName,
          parkingSlot: session.parkingSlot,
        };
      });

      setRecentLogs(mapped);

      const activeCount = data.filter((s: ParkingSessionRaw) => s.status === 'Active').length;
      setCurrentOccupied(activeCount);
    } catch (err) {
      console.warn('Failed to fetch sessions from MongoDB API:', err);
      setRecentLogs([]);
    }
  };

  useEffect(() => {
    fetchRecentSessions();
    const interval = setInterval(fetchRecentSessions, 8000);
    return () => clearInterval(interval);
  }, []);

  return {
    recentLogs,
    setRecentLogs,
    currentOccupied,
    setCurrentOccupied,
    fetchRecentSessions,
  };
};
