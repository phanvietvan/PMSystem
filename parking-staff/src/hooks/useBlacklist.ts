import { parkingService } from '../services/parking.service';
import { notificationService } from '../services/notification.service';
import { playWarningSound } from '../utils/audio';
import type { BlacklistEntry } from '../types/ParkingSession';

export const useBlacklist = (showAlert: (msg: string) => void) => {
  const checkBlacklistForPlate = async (plateToCheck: string) => {
    if (!plateToCheck) return false;
    try {
      const blData = await parkingService.getBlacklist();
      const normalizePlate = (p: string) => (p || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();

      const blacklisted = blData.find((b: BlacklistEntry) => normalizePlate(b.plateNumber) === normalizePlate(plateToCheck));
      if (blacklisted) {
        playWarningSound();
        showAlert(`🚫 TỪ CHỐI PHỤC VỤ! Xe ${blacklisted.plateNumber} nằm trong Danh Sách Đen. Lý do: ${blacklisted.reason}`);

        notificationService.pushNotification({
          role: 'admin',
          title: 'Cảnh báo xe Blacklist cố vào bãi',
          message: `Biển số ${blacklisted.plateNumber} bị từ chối phục vụ. Lý do: ${blacklisted.reason}`,
        }).catch((e) => console.error(e));
        return true;
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra blacklist', err);
    }
    return false;
  };

  return {
    checkBlacklistForPlate,
  };
};
