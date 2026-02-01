// URLs base e helpers
const RAW_BASE = (
  (import.meta.env.VITE_API_BASE as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  ''
).trim();

// Normaliza
const NORMALIZED_BASE = RAW_BASE.replace(/\s+$/, '')
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export const API_BASE = NORMALIZED_BASE;
export const API_AUTH_PREFIX = (import.meta.env.VITE_API_AUTH_PREFIX as string) || '/api/auth';
export const API_PUBLIC_PREFIX = (import.meta.env.VITE_API_PUBLIC_PREFIX as string) || '/api/public';
export const API_PROTECTED_PREFIX = (import.meta.env.VITE_API_PROTECTED_PREFIX as string) || '/api';

// Portal de Dados Abertos - CKAN
export const CKAN_BASE = ((import.meta.env.VITE_CKAN_BASE as string) || '/ckan').trim();

const join = (base: string, prefix: string, path: string) => {
  const b = base.replace(/\/+$/, '');
  const p = `/${prefix}`.replace(/^\/+/, '/').replace(/\/+$/, '');
  const pa = `/${path}`.replace(/^\/+/, '/');

  return `${b}${p}${pa}`;
};

export const apiAuth = (path: string) => join(API_BASE, API_AUTH_PREFIX, path);
export const apiPublic = (path: string) => join(API_BASE, API_PUBLIC_PREFIX, path);
export const apiProtected = (path: string) => join(API_BASE, API_PROTECTED_PREFIX, path);

export const buildAssetUrl = (maybePath: string | null | undefined) => {
  if (!maybePath) return '';
  if (/^https?:\/\//i.test(maybePath)) return encodeURI(maybePath);

  const assetsBase = (import.meta.env.VITE_ASSETS_BASE_URL as string) || '';
  const path = maybePath.startsWith('/') ? maybePath : `/${maybePath}`;

  const isUploads = /^\/?uploads(\/|$)/i.test(maybePath);
  const base = isUploads ? (API_BASE || '') : assetsBase;

  return encodeURI(`${base}${path}`);
};
