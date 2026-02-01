import { message } from 'antd';

import store from '@/stores';
import { setUserItem } from '@/stores/user.store';

let isLoggingOut = false;

export const isLogoutInProgress = (): boolean => isLoggingOut;

export const getToken = (): string | null => localStorage.getItem('token');

export const decodeJwtPayload = (token: string): any | null => {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);

  if (!payload || !payload.exp) return false; // if no exp, assume not expired (backend may not include)
  const nowSec = Math.floor(Date.now() / 1000);

  return payload.exp < nowSec;
};

// reason: 'expired' (default) when token/session expired; 'user' when user clicks logout
export const forceLogout = (reason: 'expired' | 'user' = 'expired') => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // For user-initiated logout, show a loading message until redirect
    if (reason === 'user') {
      message.destroy();
      // indefinite loading; will be cleared by page navigation
      message.loading('Deslogando...', 0);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('username');

    store.dispatch(
      setUserItem({
        logged: false,
        username: '',
        userProfile: undefined,
      }) as any,
    );

    if (reason === 'expired') {
      message.destroy();
      message.warning('Sua sessão expirou. Faça login novamente.');
    }

    const current = window.location.pathname + (window.location.search || '');

    if (!current.startsWith('/login')) {
      const to = `/login?from=${encodeURIComponent(current)}`;
      // Small delay so the "Deslogando..." or warning message is visible for a moment
      const delay = reason === 'user' ? 300 : 100;

      setTimeout(() => window.location.assign(to), delay);
    } else {
      setTimeout(() => {
        isLoggingOut = false;
      }, 300);
    }
  } catch {
    isLoggingOut = false;
  }
};

export const ensureValidAuthOrRedirect = (): boolean => {
  // If a logout is already in progress, avoid triggering again or changing view
  if (isLoggingOut) return false;
  const token = getToken();

  if (!token) {
    forceLogout();

    return false;
  }

  if (isTokenExpired(token)) {
    forceLogout();

    return false;
  }

  return true;
};
