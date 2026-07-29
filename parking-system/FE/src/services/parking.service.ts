import api from '../utils/api';

export const parkingService = {
  getParkingLots: () => api.get('/ParkingLots'),

  createParkingLot: (body: unknown) => api.post('/ParkingLots', body),

  updateParkingLot: (id: string, body: any) => {
    const floors: number[] = Array.isArray(body?.floors) ? body.floors : [];
    const rawCaps = body?.floorCapacities || {};
    // Only send numeric keys ("1","2") — drop legacy "Tầng 1" which overwrote saves on BE.
    const floorCapacities: Record<string, number> = {};
    for (const f of floors.length ? floors : Object.keys(rawCaps)) {
      const key = String(f).replace(/^Tầng\s+/i, '');
      const n = Number(rawCaps[key] ?? rawCaps[`Tầng ${key}`] ?? rawCaps[f]);
      if (Number.isFinite(n) && n > 0) floorCapacities[key] = n;
    }
    return api.put(`/ParkingLots/${id}`, {
      name: body?.name,
      latitude: body?.latitude,
      longitude: body?.longitude,
      floor: body?.floor,
      block: body?.block,
      address: body?.address,
      capacity: body?.capacity,
      floors: floors.length ? floors : undefined,
      floorCapacities: Object.keys(floorCapacities).length ? floorCapacities : undefined,
      lockedSlots: body?.lockedSlots,
    });
  },

  deleteParkingLot: (id: string) => api.delete(`/ParkingLots/${id}`),

  lockSlot: (lotId: string, slot: string) =>
    api.post(`/ParkingLots/${lotId}/lock-slot/${slot}`),

  unlockSlot: (lotId: string, slot: string) =>
    api.post(`/ParkingLots/${lotId}/unlock-slot/${slot}`),

  getParkingSessions: () => api.get('/ParkingSessions'),

  getMySession: () => api.get('/ParkingSessions/my-session'),

  getSessionHistory: () => api.get('/ParkingSessions/history'),

  verifySession: (qrCode: string) =>
    api.get(`/ParkingSessions/verify/${qrCode}`),

  getSlotsStatus: (parkingLotName: string) =>
    api.get(
      `/ParkingSessions/slots-status?parkingLotName=${encodeURIComponent(parkingLotName)}`,
    ),

  getActivePlates: () => api.get('/ParkingSessions/active-plates'),

  getPricing: () => api.get('/ParkingSessions/pricing'),

  setPricing: (body: unknown) => api.post('/ParkingSessions/pricing', body),

  gateScan: (body: unknown) => api.post('/ParkingSessions/gate-scan', body),

  checkin: (body: unknown) => api.post('/ParkingSessions/checkin', body),

  checkout: (body: unknown) => api.post('/ParkingSessions/checkout', body),

  extendSession: (id: string, body: unknown) =>
    api.post(`/ParkingSessions/${id}/extend`, body),

  cancelSession: (id: string) => api.post(`/ParkingSessions/${id}/cancel`),

  getCancelPreview: (id: string) => api.get(`/ParkingSessions/${id}/cancel-preview`),

  changeSlot: (id: string, body: { newSlot: string }) =>
    api.post(`/ParkingSessions/${id}/change-slot`, body),

  sendContact: (body: unknown) => api.post('/contact', body),
};
