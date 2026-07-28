import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

const DEFAULT_PRICES = [
  { type: 'Xe máy', price: '5.000', sub: 'VNĐ / Lượt' },
  { type: 'Ô tô 4-7 chỗ', price: '30.000', sub: 'VNĐ / Giờ' },
  { type: 'SUV / Bán tải', price: '50.000', sub: 'VNĐ / Giờ' },
];

type Options = { autoFetch?: boolean; storageKey?: string };

/** Format số / chuỗi giá → "30.000" (vi-VN) để input + ParsePrice BE khớp. */
export function formatPriceDisplay(value: unknown): string {
  if (value == null || value === '') return '0';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value).toLocaleString('vi-VN').replace(/,/g, '.');
  }
  const raw = String(value).trim();
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return raw || '0';
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return raw;
  return n.toLocaleString('vi-VN').replace(/,/g, '.');
}

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
      const response = await adminService.getPricingConfigs();
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data.map((c: any) => ({
          type: c.type ?? c.Type ?? '',
          price: formatPriceDisplay(c.price ?? c.Price),
          sub: c.sub ?? c.Sub ?? 'VNĐ / Giờ',
        }));
        setPrices(mapped);
        localStorage.setItem(storageKey, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch pricing', err);
    } finally {
      setLoading(false);
    }
    return null;
  }, [storageKey]);

  const savePricing = async (next: any[] = prices): Promise<boolean> => {
    const payload = (next || []).map((p) => ({
      type: String(p.type || '').trim(),
      price: formatPriceDisplay(p.price),
      sub: String(p.sub || 'VNĐ / Giờ').trim(),
    }));

    try {
      // Chỉ ghi qua PricingConfigs (DB). Không gọi /ParkingSessions/pricing —
      // endpoint đó từng đọc price bằng GetString() → số JSON thành 0 và ghi đè bảng giá.
      const response = await adminService.savePricingConfigs(payload);
      const saved = response.data;
      if (Array.isArray(saved) && saved.length > 0) {
        const mapped = saved.map((c: any) => ({
          type: c.type ?? c.Type ?? '',
          price: formatPriceDisplay(c.price ?? c.Price),
          sub: c.sub ?? c.Sub ?? 'VNĐ / Giờ',
        }));
        setPrices(mapped);
        localStorage.setItem(storageKey, JSON.stringify(mapped));
      } else {
        setPrices(payload);
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }
      return true;
    } catch (e) {
      console.error('Error saving pricing to backend', e);
      return false;
    }
  };

  useEffect(() => {
    if (autoFetch) void fetchPricing();
  }, [autoFetch, fetchPricing]);

  return { prices, setPrices, loading, fetchPricing, savePricing };
}
