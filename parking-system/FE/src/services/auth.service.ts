import api from '../utils/api';

export const authService = {
  login: (body: {
    email?: string;
    emailOrUsername?: string;
    password: string;
  }) => api.post('/auth/login', body),

  googleLogin: (body: unknown) => api.post('/auth/google', body),

  registerSendOtp: (body: unknown) => api.post('/auth/register/send-otp', body),

  registerCheckEmail: (email: string) =>
    api.get(`/auth/register/check-email?email=${encodeURIComponent(email)}`),

  registerVerify: (body: unknown) => api.post('/auth/register/verify', body),

  forgotPassword: (body: unknown) => api.post('/auth/password/forgot', body),

  verifyPasswordOtp: (body: unknown) => api.post('/auth/password/verify-otp', body),

  resetPassword: (body: unknown) => api.post('/auth/password/reset', body),

  updateProfile: (body: unknown) => api.put('/auth/profile', body),

  getMe: () => api.get('/auth/me'),
};
