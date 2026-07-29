import { apiFetch, readErrorMessage } from '../utils/api';
import type { ParkingLot } from '../types/ParkingLot';
import type {
  ParkingSessionRaw,
  CheckinPayload,
  CheckoutPayload,
  GateScanPayload,
  VerifyQrResponse,
  BlacklistEntry,
} from '../types/ParkingSession';

const jsonHeaders = (): HeadersInit => ({ 'Content-Type': 'application/json' });

export const parkingService = {
  async getParkingLots(): Promise<ParkingLot[]> {
    const response = await apiFetch('/ParkingLots');
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to fetch parking lots'));
    }
    return response.json();
  },

  async getParkingSessions(): Promise<ParkingSessionRaw[]> {
    const response = await apiFetch('/ParkingSessions');
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to fetch parking sessions'));
    }
    return response.json();
  },

  async getBlacklist(): Promise<BlacklistEntry[]> {
    const response = await apiFetch(`/Blacklist?t=${new Date().getTime()}`);
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Failed to fetch blacklist'));
    }
    return response.json();
  },

  async checkin(payload: CheckinPayload): Promise<ParkingSessionRaw> {
    const response = await apiFetch('/ParkingSessions/checkin', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Checkin API failed'));
    }
    return response.json();
  },

  async checkout(payload: CheckoutPayload): Promise<void> {
    const response = await apiFetch('/ParkingSessions/checkout', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Checkout API failed'));
    }
  },

  async verifyQr(qrCode: string): Promise<VerifyQrResponse> {
    const response = await apiFetch(`/ParkingSessions/verify/${encodeURIComponent(qrCode)}`);
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'QR verification API failed'));
    }
    return response.json();
  },

  async gateScan(payload: GateScanPayload): Promise<ParkingSessionRaw> {
    const response = await apiFetch('/ParkingSessions/gate-scan', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Gate scan API failed'));
    }
    return response.json();
  },

  async getActiveSessionsByPlates(plates: string[]): Promise<ParkingSessionRaw[]> {
    const response = await apiFetch('/ParkingSessions/active-by-plates', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(plates),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Active sessions by plates API failed'));
    }
    return response.json();
  },
};
