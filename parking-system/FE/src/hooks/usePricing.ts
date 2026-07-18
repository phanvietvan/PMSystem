import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { parkingService } from '../services/parking.service';

const DEFAULT_PRICES = [
  { type: 'Xe máy', price: '5.000', sub: 'VNĐ / Lượt' },
  { type: 'Ô tô 4-7 chỗ', price: '30.000', sub: 'VNĐ / Giờ' },
  { type: 'SUV / Bán tải', price: '50.000', sub: 'VNĐ / Giờ' },
];

type Options = { autoFetch?: boolean; storageKey?: string };

export function usePricing(options: Options = {}) {
  const { autoFetch = true, storageKey = 'parking_pricing' } = options;

  const [prices, setPrices] = useState<any[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : DEFAULT_PRICES;
  });
  const [loading, setLoading] = useState(false);

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const response = await adminService.getPricingConfigs();
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map((c: any) => ({
            type: c.type,
            price: c.price,
            sub: c.sub,
          }));
          setPrices(mapped);
          localStorage.setItem(storageKey, JSON.stringify(mapped));
          return mapped;
        }
      } catch {
        /* fallback */
      }
      const response = await parkingService.getPricing();
      if (response.data && Array.isArray(response.data)) {
        setPrices(response.data);
        localStorage.setItem(storageKey, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.error('Failed to fetch pricing', err);
    } finally {
      setLoading(false);
    }
    return null;
  }, [storageKey]);

  const savePricing = async (next: any[] = prices) => {
    try {
      await adminService.savePricingConfigs(next);
    } catch (e) {
      console.error('Error saving pricing to backend', e);
    }
    try {
      await parkingService.setPricing(next);
    } catch {
      /* optional */
    }
    setPrices(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  useEffect(() => {
    if (autoFetch) void fetchPricing();
  }, [autoFetch, fetchPricing]);

  return { prices, setPrices, loading, fetchPricing, savePricing };
}
