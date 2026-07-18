import { API_BASE_URL } from '../utils/api';
import type { User } from '../types/User';

const TOKEN_KEY = 'staff_token';
const USER_KEY = 'staff_user';
const AUTH_EVENT = 'staff-auth-changed';

export type LoginResult =
  | { ok: true; user: User; accessToken: string }
  | { ok: false; message: string };

const normalizeRole = (role: unknown): string => {
  if (role === 1 || role === '1') return 'Staff';
  if (role === 2 || role === '2') return 'Admin';
  return String(role ?? '');
};

export const authService = {
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  },

  /** Staff app: only Staff or Admin may enter the gate console. */
  canAccessStaffApp(user?: User | null): boolean {
    const u = user === undefined ? authService.getCurrentUser() : user;
    if (!u) return false;
    const role = normalizeRole(u.role).toLowerCase();
    return role === 'staff' || role === 'admin';
  },

  setSession(accessToken: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  },

  /** Shared: parse auth response, enforce Staff/Admin, persist session. */
  finalizeAuthResponse(body: unknown, fallbackError: string): LoginResult {
    const root = body as { message?: string; errors?: string[]; data?: unknown } | null;
    const payload = (root?.data ?? body) as {
      accessToken?: string;
      AccessToken?: string;
      user?: User;
      User?: User;
    } | null;

    const accessToken = payload?.accessToken ?? payload?.AccessToken;
    const user = payload?.user ?? payload?.User;

    if (!accessToken || !user) {
      return {
        ok: false,
        message: root?.message || root?.errors?.[0] || fallbackError,
      };
    }

    const normalizedUser: User = {
      ...user,
      role: normalizeRole(user.role),
    };

    if (!this.canAccessStaffApp(normalizedUser)) {
      return {
        ok: false,
        message: 'Tài khoản này không có quyền truy cập cổng nhân viên (cần Staff hoặc Admin).',
      };
    }

    this.setSession(accessToken, normalizedUser);
    return { ok: true, user: normalizedUser, accessToken };
  },

  async login(emailOrUsername: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          message:
            body?.message ||
            body?.errors?.[0] ||
            'Đăng nhập thất bại. Vui lòng kiểm tra tài khoản / mật khẩu.',
        };
      }

      return this.finalizeAuthResponse(body, 'Phản hồi đăng nhập không hợp lệ từ máy chủ.');
    } catch (err) {
      console.error('Staff login error:', err);
      return {
        ok: false,
        message: 'Không kết nối được máy chủ. Kiểm tra BE đang chạy và VITE_API_URL.',
      };
    }
  },

  /** Google OAuth: send access_token as idToken (same contract as customer FE). Role must be Staff/Admin. */
  async loginWithGoogle(googleAccessToken: string): Promise<LoginResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: googleAccessToken }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          message: body?.message || body?.errors?.[0] || 'Đăng nhập Google thất bại.',
        };
      }

      return this.finalizeAuthResponse(body, 'Phản hồi đăng nhập Google không hợp lệ từ máy chủ.');
    } catch (err) {
      console.error('Staff Google login error:', err);
      return {
        ok: false,
        message: 'Không kết nối được máy chủ. Kiểm tra BE đang chạy và VITE_API_URL.',
      };
    }
  },

  logout(): void {
    this.clearSession();
  },

  getDisplayName(user: User | null): string {
    if (!user) return 'Nhân viên Cổng';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;
  },

  subscribeUserEvents(callback: () => void): () => void {
    window.addEventListener('storage', callback);
    window.addEventListener(AUTH_EVENT, callback);
    return () => {
      window.removeEventListener('storage', callback);
      window.removeEventListener(AUTH_EVENT, callback);
    };
  },
};
