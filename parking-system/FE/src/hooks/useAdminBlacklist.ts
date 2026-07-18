import { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/admin.service';
import { useIncidents } from './useIncidents';
import { useNotifications } from './useNotifications';

export function useAdminBlacklist() {
  const [searchTerm, setSearchTerm] = useState('');
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [notifRole, setNotifRole] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [newPlate, setNewPlate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { incidents, fetchIncidents, resolveIncident } = useIncidents({ autoFetch: true });
  const {
    notifications: notifHistory,
    fetchNotifications: fetchNotifHistory,
    pushNotification,
  } = useNotifications({ pollIntervalMs: 0 });

  const pendingReports = useMemo(
    () =>
      incidents.filter(
        (i: any) => i.type === 'BlacklistReport' && i.status === 'Chờ xử lý'
      ),
    [incidents]
  );

  const fetchBlacklist = async () => {
    try {
      const res = await adminService.getBlacklist();
      setBlacklist(res.data);
    } catch (error) {
      console.error('Error fetching blacklist', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBlacklist();
    void fetchNotifHistory();

    const interval = setInterval(() => {
      void fetchIncidents();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchIncidents, fetchNotifHistory]);

  const handleResolveReport = async (report: any, action: 'approve' | 'reject') => {
    const confirmApprove = 'Xác nhận đưa phương tiện này vào danh sách đen?';
    const confirmReject = 'Từ chối báo cáo này?';
    if (action === 'approve' && !window.confirm(confirmApprove)) return;
    if (action === 'reject' && !window.confirm(confirmReject)) return;

    let plate = report.title.replace('Báo cáo xe vi phạm:', '').trim();
    if (!plate) plate = 'KHONG_RO';

    let reasonToSave = report.description;
    try {
      const parsed = JSON.parse(report.description);
      if (parsed && parsed.reason) {
        reasonToSave = parsed.reason;
      }
    } catch {
      /* keep raw description */
    }

    try {
      if (action === 'approve') {
        await adminService.addBlacklist({ plateNumber: plate, reason: reasonToSave });
      }
      await resolveIncident(report.id);
      await fetchBlacklist();
      await fetchIncidents();
    } catch (e) {
      console.error(e);
      alert('Thao tác thất bại');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;

    try {
      await pushNotification({
        role: notifRole,
        title: notifTitle,
        message: notifMessage,
      });
      setIsSent(true);
      await fetchNotifHistory();
      setTimeout(() => {
        setIsSent(false);
        setNotifTitle('');
        setNotifMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error pushing notification', error);
      alert('Gửi thông báo thất bại');
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newReason) return;
    try {
      await adminService.addBlacklist({ plateNumber: newPlate, reason: newReason });
      setNewPlate('');
      setNewReason('');
      setShowAddModal(false);
      await fetchBlacklist();
    } catch (error) {
      console.error('Error adding to blacklist', error);
      alert('Thêm thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = 'Bạn có chắc muốn xóa khỏi danh sách đen?';
    if (!window.confirm(confirmDelete)) return;
    try {
      await adminService.removeBlacklist(id);
      await fetchBlacklist();
    } catch (error) {
      console.error('Error deleting', error);
    }
  };

  const filteredList = blacklist.filter((item) =>
    item.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    searchTerm,
    setSearchTerm,
    blacklist,
    pendingReports,
    isLoading,
    notifRole,
    setNotifRole,
    notifTitle,
    setNotifTitle,
    notifMessage,
    setNotifMessage,
    isSent,
    notifHistory,
    showHistory,
    setShowHistory,
    newPlate,
    setNewPlate,
    newReason,
    setNewReason,
    showAddModal,
    setShowAddModal,
    filteredList,
    handleResolveReport,
    handleSendNotification,
    handleAddBlacklist,
    handleDelete,
  };
}
