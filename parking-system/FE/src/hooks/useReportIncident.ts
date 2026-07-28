import { useState, useEffect, useMemo } from 'react';
import { useIncidents } from './useIncidents';
import { useParkingLots } from './useParkingLots';

export interface Incident {
  id: string;
  type: string;
  title: string;
  description: string;
  branch: string;
  floor: string;
  urgency: 'Bình thường' | 'Cao' | 'Khẩn cấp';
  userId?: string;
  reporter: string;
  role: string;
  createdAt: string;
  status: 'Chờ xử lý' | 'Đã xử lý';
}

const FALLBACK_BRANCHES = [
  { id: 1, name: 'Landmark 81 - Bãi đỗ A1', floors: [1, 2, 3] },
  { id: 2, name: 'Bitexco Financial - Bãi đỗ B2', floors: [1, 2, 3] },
  { id: 3, name: 'Vincom Center - Bãi đỗ V3', floors: [1, 2, 3] },
];

export function useReportIncident() {
  const [user, setUser] = useState<any>(null);
  const [type, setType] = useState('Thiết bị hỏng');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('Landmark 81 - Bãi đỗ A1');
  const [floor, setFloor] = useState('Tầng 1');
  const [urgency, setUrgency] = useState<'Bình thường' | 'Cao' | 'Khẩn cấp'>('Bình thường');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { incidents, fetchIncidents, createIncident } = useIncidents({ autoFetch: false });
  const { parkingLots, fetchParkingLots } = useParkingLots({ autoFetch: false });

  const branches = parkingLots.length > 0 ? parkingLots : FALLBACK_BRANCHES;

  const reporterName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email
    : 'Khách vãng lai';

  const myIncidents = useMemo(() => {
    return (incidents as Incident[]).filter((inc) => {
      if (user?.id) {
        return inc.userId === user.id || inc.reporter === reporterName;
      }
      return inc.reporter === reporterName;
    });
  }, [incidents, user, reporterName]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        /* ignore */
      }
    }

    void fetchParkingLots();
  }, [fetchParkingLots]);

  useEffect(() => {
    if (user) {
      void fetchIncidents();
    }
  }, [user, fetchIncidents]);

  useEffect(() => {
    const selectedObj = branches.find((b: any) => b.name === branch);
    if (selectedObj && selectedObj.floors && selectedObj.floors.length > 0) {
      setFloor(`Tầng ${selectedObj.floors[0]}`);
    }
  }, [branch, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newIncidentPayload = {
      type,
      title,
      description,
      branch,
      floor,
      urgency,
      userId: user ? user.id : null,
    };

    try {
      await createIncident(newIncidentPayload);
      setIsSubmitted(true);
      setTitle('');
      setDescription('');

      await fetchIncidents();

      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting incident to database:', error);
      alert('Không thể gửi báo cáo sự cố lúc này. Vui lòng thử lại sau.');
    }
  };

  const getLocalizedUrgency = (urg: string) => {
    if (urg === 'Khẩn cấp') return 'Khẩn cấp';
    if (urg === 'Cao') return 'Cao';
    return 'Bình thường';
  };

  const getLocalizedStatus = (status: string) => {
    if (status === 'Đã xử lý') return 'Đã xử lý';
    return 'Chờ xử lý';
  };

  const getLocalizedFloor = (fl: string) => {
    if (!fl) return '';
    return fl.replace('Tầng', 'Tầng');
  };

  const getLocalizedType = (tType: string) => {
    if (tType === 'Thiết bị hỏng') return 'Thiết bị hỏng';
    if (tType === 'Lỗi thanh toán') return 'Lỗi thanh toán';
    if (tType === 'Xe đỗ sai vị trí') return 'Xe đỗ sai vị trí';
    if (tType === 'Vấn đề thẻ/vé') return 'Vấn đề thẻ/vé';
    if (tType === 'Khác') return 'Khác';
    return tType;
  };

  return {
    type,
    setType,
    title,
    setTitle,
    description,
    setDescription,
    branch,
    setBranch,
    floor,
    setFloor,
    urgency,
    setUrgency,
    isSubmitted,
    setIsSubmitted,
    branches,
    myIncidents,
    handleSubmit,
    getLocalizedUrgency,
    getLocalizedStatus,
    getLocalizedFloor,
    getLocalizedType,
  };
}
