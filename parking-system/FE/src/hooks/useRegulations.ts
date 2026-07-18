import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const DEFAULT_REGULATIONS = [
  'Vui lòng đỗ xe đúng vị trí ô đỗ đã đặt trước hoặc quét mã tại chỗ.',
  'Tốc độ di chuyển tối đa trong toàn bộ khuôn viên bãi đỗ xe là 10km/h.',
  'Tuân thủ tuyệt đối chỉ dẫn của nhân viên và biển báo thông minh.',
  'Thực hiện thanh toán trực tuyến qua ứng dụng trước khi ra cổng chắn.',
  'Không chứa các chất dễ cháy nổ, vũ khí hoặc hàng cấm trong phương tiện.',
  'Tự bảo quản tài sản cá nhân có giá trị. Ban quản lý không chịu trách nhiệm mất mát trong xe.',
];

type Options = { autoFetch?: boolean; storageKey?: string };

/** Regulations as string[] (nội dung hiển thị). */
export function useRegulations(options: Options = {}) {
  const { autoFetch = true, storageKey = 'parking_regulations' } = options;

  const [regulations, setRegulations] = useState<string[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : DEFAULT_REGULATIONS;
  });
  const [loading, setLoading] = useState(false);

  const fetchRegulations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getRegulations();
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data.map((r: any) =>
          typeof r === 'string' ? r : r.content,
        );
        setRegulations(mapped);
        localStorage.setItem(storageKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch regulations', err);
      const saved = localStorage.getItem(storageKey);
      if (saved) setRegulations(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
    return [];
  }, [storageKey]);

  const saveRegulations = async (next: string[] = regulations) => {
    try {
      await adminService.saveRegulations(next);
    } catch (e) {
      console.error('Error saving regulations to backend', e);
    }
    setRegulations(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  useEffect(() => {
    if (autoFetch) void fetchRegulations();
  }, [autoFetch, fetchRegulations]);

  return { regulations, setRegulations, loading, fetchRegulations, saveRegulations };
}
