import { authService } from '../services/auth.service';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : 'https://pmsystem-oxl8.onrender.com/api');

/** fetch wrapper: attach Bearer token, clear session on 401 (expired/invalid). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = authService.getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(
    path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    { ...init, headers }
  );

  if (response.status === 401) {
    authService.clearSession();
  }

  return response;
}

export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return body?.message || body?.errorMessage || body?.errors?.[0] || fallback;
  } catch {
    return fallback;
  }
}
