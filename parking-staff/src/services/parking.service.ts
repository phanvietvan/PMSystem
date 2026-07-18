import { API_BASE_URL } from '../utils/api';
import { authService } from './auth.service';
import type { ParkingLot } from '../types/ParkingLot';
import type {
  ParkingSessionRaw,
  CheckinPayload,
  CheckoutPayload,
  GateScanPayload,
  VerifyQrResponse,
  BlacklistEntry,
} from '../types/ParkingSession';

const authHeaders = (json = false): HeadersInit => {
  const token = authService.getToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const parkingService = {
  async getParkingLots(): Promise<ParkingLot[]> {
    const response = await fetch(`${API_BASE_URL}/ParkingLots`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch parking lots');
    }
    return response.json();
  },

  async getParkingSessions(): Promise<ParkingSessionRaw[]> {
    const response = await fetch(`${API_BASE_URL}/ParkingSessions`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch parking sessions');
    }
    return response.json();
  },

  async getBlacklist(): Promise<BlacklistEntry[]> {
    const response = await fetch(`${API_BASE_URL}/Blacklist?t=${new Date().getTime()}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch blacklist');
    }
    return response.json();
  },

  async checkin(payload: CheckinPayload): Promise<ParkingSessionRaw> {
    const response = await fetch(`${API_BASE_URL}/ParkingSessions/checkin`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Checkin API failed');
    }
    return response.json();
  },

  async checkout(payload: CheckoutPayload): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ParkingSessions/checkout`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Checkout API failed');
    }
  },

  async verifyQr(qrCode: string): Promise<VerifyQrResponse> {
    const response = await fetch(`${API_BASE_URL}/ParkingSessions/verify/${qrCode}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error('QR verification API failed');
    }
    return response.json();
  },

  async gateScan(payload: GateScanPayload): Promise<ParkingSessionRaw> {
    const response = await fetch(`${API_BASE_URL}/ParkingSessions/gate-scan`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Gate scan API failed');
    }
    return response.json();
  },

  async getActiveSessionsByPlates(plates: string[]): Promise<ParkingSessionRaw[]> {
    const response = await fetch(`${API_BASE_URL}/ParkingSessions/active-by-plates`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(plates),
    });
    if (!response.ok) {
      throw new Error('Active sessions by plates API failed');
    }
    return response.json();
  },
};
