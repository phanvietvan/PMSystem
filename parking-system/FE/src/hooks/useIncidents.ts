import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';

type Options = {
  autoFetch?: boolean;
};

export function useIncidents(options: Options = {}) {
  const { autoFetch = true } = options;
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getIncidents();
      const data = response.data ?? [];
      setIncidents(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Error fetching incidents', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchIncidents();
  }, [autoFetch, fetchIncidents]);

  const resolveIncident = async (id: string) => {
    await adminService.resolveIncident(id);
    await fetchIncidents();
  };

  const deleteIncident = async (id: string) => {
    await adminService.deleteIncident(id);
    await fetchIncidents();
  };

  const createIncident = async (body: unknown) => {
    await adminService.createIncident(body);
    await fetchIncidents();
  };

  return {
    incidents,
    setIncidents,
    loading,
    fetchIncidents,
    resolveIncident,
    deleteIncident,
    createIncident,
  };
}
