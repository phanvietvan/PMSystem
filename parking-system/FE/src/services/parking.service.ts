import api from '../utils/api';

export const parkingService = {
  getParkingLots: () => api.get('/ParkingLots'),

  createParkingLot: (body: unknown) => api.post('/ParkingLots', body),

  updateParkingLot: (id: string, body: unknown) =>
    api.put(`/ParkingLots/${id}`, body),

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
