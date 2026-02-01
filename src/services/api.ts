import axios from 'axios';

const rawBase = (
  (import.meta.env.VITE_API_BASE as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  ''
).trim();

// Normaliza
const normalizedBase = rawBase
  .replace(/\s+$/, '')
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export const api = axios.create({
  ...(normalizedBase ? { baseURL: normalizedBase } : {}),
  timeout: 20000,
  withCredentials: false,
});

export type ApiClient = typeof api;
