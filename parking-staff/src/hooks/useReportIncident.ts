import { incidentService } from '../services/incident.service';
import type { User } from '../types/User';

export const useReportIncident = (currentUser: User | null, showAlert: (msg: string) => void) => {
  const reportVehicle = async (plate: string, reason: string, logData: any) => {
    const plateToSend = logData ? logData.plate : plate.trim().toUpperCase();
    if (!plateToSend || !reason.trim()) return false;
    try {
      const success = await incidentService.createIncident({
        type: 'BlacklistReport',
        title: `Báo cáo xe vi phạm: ${plateToSend}`,
        description: JSON.stringify({
          reason: reason.trim(),
          photo: logData?.photo || '',
          customerName: logData?.customerName || '',
          customerPhone: logData?.customerPhone || '',
          entryTime: logData?.entryTimeStr || '',
          parkingLot: logData?.parkingLotName
            ? `${logData.parkingLotName} • Slot ${logData.parkingSlot || '--'}`
            : '',
        }),
        reporter: currentUser?.email || 'Nhân viên cổng',
        role: 'Staff',
      });
      if (success) {
        showAlert('✅ Đã gửi báo cáo cho Admin xem xét!');
        return true;
      }
    } catch (err) {
      console.error(err);
      showAlert('❌ Lỗi gửi báo cáo!');
    }
    return false;
  };

  return {
    reportVehicle,
  };
};
