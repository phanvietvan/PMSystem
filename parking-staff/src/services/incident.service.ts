import { apiFetch } from '../utils/api';
import type { Incident } from '../types/Incident';

export const incidentService = {
  async createIncident(incident: Partial<Incident>): Promise<boolean> {
    const response = await apiFetch('/Incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    return response.ok;
  },
};
