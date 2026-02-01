import type { AxiosRequestConfig, Method } from 'axios';

import { message as $message } from 'antd';
import axios from 'axios';

import { API_BASE } from '@/config/api';
import { api as axiosInstance } from '@/services/api';
import store from '@/stores';
import { setGlobalState } from '@/stores/global.store';
import { forceLogout } from '@/utils/auth';

let activeRequests = 0;
let showTimer: number | undefined;
let hideTimer: number | undefined;

const SHOW_DELAY = 150; 
const HIDE_DELAY = 100; 

function onRequestStart() {
  activeRequests = Math.max(0, activeRequests) + 1;

  if (activeRequests === 1) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }

    showTimer = window.setTimeout(() => {
      store.dispatch(
        setGlobalState({
          loading: true,
        }),
      );
    }, SHOW_DELAY);
  }
}

function onRequestEnd() {
  activeRequests = Math.max(0, activeRequests - 1);

  if (activeRequests === 0) {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }

    hideTimer = window.setTimeout(() => {
      store.dispatch(
        setGlobalState({
          loading: false,
        }),
      );
    }, HIDE_DELAY);
  }
}

axiosInstance.interceptors.request.use(
  config => {
    onRequestStart();

  // Token
    const token = localStorage.getItem('token');

  // Enviar Authorization apenas para nossas APIs (não para CKAN)
    const url = config.url || '';
    const isRelativeApi = /^\/api(\/|$)/i.test(url);
    const isCkan = /^\/ckan(\/|$)/i.test(url) || /\bhttps?:\/\/[^\s]*dadosabertos\.go\.gov\.br/i.test(url);
    let isOurApiBase = false;
    try {
      const abs = new URL(url, window.location.origin).href.replace(/\/$/, '');
      const base = (API_BASE || '').replace(/\/$/, '');
      isOurApiBase = !!base && abs.startsWith(base);
    } catch {}

    if (token && config.headers && (isRelativeApi || isOurApiBase) && !isCkan) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    onRequestEnd();
    Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  config => {
    onRequestEnd();

    const data = config?.data;

    // Se a resposta for HTML (erro do CKAN ou redirect), tratar como erro
    if (typeof data === 'string' && data.trim().startsWith('<!DOCTYPE')) {
      console.error('Resposta HTML recebida (esperado JSON):', data.substring(0, 200));
      throw new Error('Resposta inválida do servidor (HTML ao invés de JSON)');
    }

    if (data && typeof data === 'object' && 'status' in data) {
      return data;
    }

    return {
      status: true,
      message: 'success',
      result: data,
    };
  },
  async error => {
    onRequestEnd();

    const cfg: any = error?.config || {};
    const status: number | undefined = error?.response?.status;
    const url: string = cfg?.url || '';

  // Cancel
    if (axios.isCancel && axios.isCancel(error)) {
      return Promise.reject(error);
    }

  let errorMessage = 'Ocorreu um erro inesperado.';
    const data = error?.response?.data;

    // Verificar se recebeu HTML ao invés de JSON
    if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
      errorMessage = 'Servidor retornou HTML ao invés de dados. Verifique a URL ou disponibilidade do serviço.';
      console.error('HTML recebido:', data.substring(0, 300));
    } else if (error?.code === 'ECONNABORTED') {
      errorMessage = 'Tempo de requisição esgotado. Tente novamente.';
    } else if (error?.message?.includes('Network Error')) {
      errorMessage = 'Erro de rede. Verifique sua conexão.';
    } else if (data?.erro) {
      errorMessage = data.erro;
    } else if (data?.message) {
      errorMessage = data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

  // 401: login
  const isLoginEndpoint = /\/api\/auth\/login(\?|$)/.test(url) || /\/api\/auth\/login$/.test(url);

    if (status === 401) {
      if (!isLoginEndpoint) {
        forceLogout();
      }

      return Promise.reject(error);
    }

    const method = (cfg?.method || 'get').toLowerCase();
    const shouldRetry =
      method === 'get' &&
      (!status || status >= 500 || error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error'));

    cfg.__retryCount = cfg.__retryCount || 0;

    if (shouldRetry && cfg.__retryCount < 1) {
      cfg.__retryCount += 1;
      await new Promise(res => setTimeout(res, 300));

      return axiosInstance.request(cfg);
    }

    // Extra debug: log 404 route issues with method and URL
    try {
      if (status === 404) {
        // eslint-disable-next-line no-console
        console.error('[HTTP 404] Rota não encontrada', {
          method: cfg?.method,
          url: cfg?.url,
          baseURL: cfg?.baseURL,
          params: cfg?.params,
        });
      }
    } catch {}

    errorMessage && $message.error(errorMessage);

    return Promise.reject(error);
  },
);

export type Response<T = any> = {
  status: boolean;
  message: string;
  result: T;
};

export type MyResponse<T = any> = Promise<Response<T>>;

export const request = <T = any>(
  method: Lowercase<Method>,
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): MyResponse<T> => {
  const m = method.toLowerCase() as Lowercase<Method>;
  const isGet = m === 'get';

  return axiosInstance.request({
    method: m,
    url,
    ...(isGet ? { params: data } : { data }),
    ...config,
  });
};
