// Danh sách toàn bộ API Endpoints của ứng dụng
// Bạn có thể import file này vào các Component để sử dụng dần dần thay vì gõ tay chuỗi string.

export const ENDPOINTS = {
  AUTH: {
    ME: '/auth/me',
    LOGIN: '/auth/login',
    GOOGLE_LOGIN: '/auth/google',
    REGISTER_SEND_OTP: '/auth/register/send-otp',
    REGISTER_CHECK_EMAIL: (email: string) => `/auth/register/check-email?email=${encodeURIComponent(email)}`,
    REGISTER_VERIFY: '/auth/register/verify',
    FORGOT_PASSWORD: '/auth/password/forgot',
    VERIFY_OTP: '/auth/password/verify-otp',
    RESET_PASSWORD: '/auth/password/reset',
    PROFILE: '/auth/profile',
  },
  USERS: {
    GET_ALL: '/users',
    UPDATE: (id: string | number) => `/users/${id}`,
    DELETE: (id: string | number) => `/users/${id}`,
  },
  INCIDENTS: {
    GET_ALL: '/Incidents',
    CREATE: '/Incidents',
  },
  PARKING_LOTS: {
    GET_ALL: '/ParkingLots',
  },
  PARKING_SESSIONS: {
    GET_ALL: '/ParkingSessions',
    MY_SESSION: '/ParkingSessions/my-session',
    ACTIVE_PLATES: '/ParkingSessions/active-plates',
    VERIFY_QR: (qrCode: string) => `/ParkingSessions/verify/${qrCode}`,
    PRICING: '/ParkingSessions/pricing',
    SLOTS_STATUS: (parkingLotName?: string) => 
      parkingLotName ? `/ParkingSessions/slots-status?parkingLotName=${encodeURIComponent(parkingLotName)}` : '/ParkingSessions/slots-status',
    CHECK_IN: '/ParkingSessions/checkin',
    CHECK_OUT: '/ParkingSessions/checkout',
    GATE_SCAN: '/ParkingSessions/gate-scan',
  },
  PAYMENTS: {
    VNPAY_CREATE: '/Payments/vnpay/create-payment-url',
    VNPAY_VERIFY: (queryString: string) => `/Payments/vnpay/verify${queryString}`,
  },
  SETTINGS: {
    PRICING_CONFIGS: '/PricingConfigs',
    REGULATIONS: '/Regulations',
  },
  CONTACT: {
    SUBMIT: '/contact'
  }
};
