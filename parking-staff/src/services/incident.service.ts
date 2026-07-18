import { API_BASE_URL } from '../utils/api';
import { authService } from './auth.service';
import type { Incident } from '../types/Incident';

export const incidentService = {
  async createIncident(incident: Partial<Incident>): Promise<boolean> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/Incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(incident),
    });
    return response.ok;
  },
};
