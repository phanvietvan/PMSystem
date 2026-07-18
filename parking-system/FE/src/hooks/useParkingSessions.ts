import { useCallback, useEffect, useRef, useState } from 'react';
import { parkingService } from '../services/parking.service';

type Options = {
  autoFetch?: boolean;
  /** Poll ms; 0 = không poll */
  pollIntervalMs?: number;
};

function unwrapSessions(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: any[] }).data;
  }
  return [];
}

export function useParkingSessions(options: Options = {}) {
  const { autoFetch = true, pollIntervalMs = 0 } = options;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const response = await parkingService.getParkingSessions();
      const data = unwrapSessions(response.data);
      setSessions(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch parking sessions', err);
      return [];
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    void fetchSessions();
    if (pollIntervalMs <= 0) return;
    const id = setInterval(() => void fetchSessions(), pollIntervalMs);
    return () => clearInterval(id);
  }, [autoFetch, pollIntervalMs, fetchSessions]);

  return { sessions, setSessions, loading, fetchSessions };
}
