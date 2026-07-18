import { useCallback, useEffect, useState } from 'react';
import { parkingService } from '../services/parking.service';

type Options = {
  /** Tự fetch khi mount (mặc định true) */
  autoFetch?: boolean;
};

export function useParkingLots(options: Options = {}) {
  const { autoFetch = true } = options;
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParkingLots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await parkingService.getParkingLots();
      const data = response.data ?? [];
      setParkingLots(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Failed to fetch parking lots', err);
      setError('Không tải được danh sách bãi xe');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchParkingLots();
  }, [autoFetch, fetchParkingLots]);

  return { parkingLots, setParkingLots, loading, error, fetchParkingLots };
}
