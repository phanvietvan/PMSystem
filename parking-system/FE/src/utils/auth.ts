export interface StoredUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  licensePlate?: string;
  vehicleType?: string;
  address?: string;
  role?: string | number;
  status?: string;
  avatarUrl?: string;
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function getUserDisplayName(user?: StoredUser | null): string {
  const u = user ?? getStoredUser();
  if (!u) return 'Tài khoản';
  if (u.firstName || u.lastName) {
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  }
  return u.username || u.email;
}

export function getUserInitials(user?: StoredUser | null): string {
  const name = getUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getRoleLabel(user?: StoredUser | null): string {
  const u = user ?? getStoredUser();
  const role = u?.role;
  if (role === 'Admin' || role === 'admin' || role === 2 || role === '2') return 'Quản trị viên';
  if (role === 'Staff' || role === 1 || role === '1') return 'Nhân viên';
  return 'Người dùng';
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('user-login'));
}

export function isAdmin(user?: StoredUser | null): boolean {
  const u = user ?? getStoredUser();
  if (!u) return false;
  const role = u.role;
  if (role === 'Admin' || role === 'admin') return true;
  if (role === 2 || role === '2') return true;
  return false;
}

/** Refresh user from GET /auth/me (includes role from database). */
export async function syncCurrentUserFromApi(
  api: { get: (url: string) => Promise<{ data: unknown }> }
): Promise<StoredUser | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await api.get('/auth/me');
    const body = response.data as {
      success?: boolean;
      data?: StoredUser;
    };
    const user = body?.data;
    if (!user) return null;

    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('user-login'));
    return user;
  } catch {
    return null;
  }
}

export function parseLicensePlate(raw: string | null | undefined): string {
  if (!raw) return '51F-123.45';
  const clean = raw.trim();
  if (clean.startsWith('[') && clean.endsWith(']')) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const item = parsed[0];
        return item.plate || item.PLATE || item.Plate || clean;
      }
    } catch (e) {}
  }
  return clean;
}

/* ─── Active Session QR Helpers (supports multiple parked vehicles) ─── */

/** Get all active session QR codes */
export function getActiveQrs(): string[] {
  try {
    const raw = localStorage.getItem('activeSessionQrs');
    if (raw) return JSON.parse(raw) as string[];
    // Migration: read old single-value key
    const legacy = localStorage.getItem('activeSessionQr');
    if (legacy) {
      const arr = [legacy];
      localStorage.setItem('activeSessionQrs', JSON.stringify(arr));
      localStorage.removeItem('activeSessionQr');
      return arr;
    }
  } catch {}
  return [];
}

/** Add a QR code to active sessions */
export function addActiveQr(qr: string): void {
  const arr = getActiveQrs();
  if (!arr.includes(qr)) arr.push(qr);
  localStorage.setItem('activeSessionQrs', JSON.stringify(arr));
}

/** Remove a QR code from active sessions */
export function removeActiveQr(qr: string): void {
  const arr = getActiveQrs().filter(q => q !== qr);
  localStorage.setItem('activeSessionQrs', JSON.stringify(arr));
}

/** Check if user has any active sessions */
export function hasActiveSessions(): boolean {
  return getActiveQrs().length > 0;
}
