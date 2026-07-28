export interface ParkingSession {
  plate: string;
  status: string;
  time: string;
  createdTimeStr: string;
  createdDateStr: string;
  entryTimeStr: string;
  entryDateStr: string;
  exitTimeStr: string;
  exitDateStr: string;
  isCheckedIn: boolean;
  type: 'ENTRY' | 'EXIT' | 'PENDING' | 'CANCELLED' | 'ALERT';
  owner: string;
  ticketType: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  photo: string;
  entryPhoto?: string;
  exitPhoto?: string;
  qrCode: string;
  totalFee: number;
  parkingLotName?: string;
  parkingSlot?: string;
}

export interface ParkingSessionRaw {
  id?: string;
  licensePlate: string;
  entryTime: string;
  exitTime?: string;
  createdAt?: string;
  status: 'Active' | 'Completed' | 'Cancelled' | string;
  isCheckedIn: boolean;
  userId?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  entryPhoto?: string;
  exitPhoto?: string;
  qrCode: string;
  totalFee: number;
  parkingLotName?: string;
  parkingLotId?: string;
  ParkingLotId?: string;
  parkingSlot?: string;
  vehicleType?: string;
  VehicleType?: string;
  reservationDate?: string;
  reservationStartTime?: string;
}

export interface GateScanPayload {
  qrCode: string;
  entryPhoto: string;
}

export interface CheckinPayload {
  licensePlate: string;
  entryPhoto: string;
  parkingLotName: string;
  parkingLotId?: string;
  vehicleType: string;
}

export interface CheckoutPayload {
  qrCode: string;
  exitLicensePlate: string;
  exitPhoto: string;
  extraFees: { name: string; amount: number }[];
}

export interface VerifyQrResponse {
  session: ParkingSessionRaw;
  Session?: any;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  User?: any;
  fee?: number;
  Fee?: number;
  prepaidAmount?: number;
  PrepaidAmount?: number;
}

export interface BlacklistEntry {
  id?: string;
  plateNumber: string;
  reason: string;
  createdAt?: string;
}
