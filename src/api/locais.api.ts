import { apiProtected } from '@/config/api';

import { request } from './request';

export const apiListLocaisProtected = () => request('get', apiProtected('/locais'));
export const apiCreateLocal = (data: any) => request('post', apiProtected('/locais'), data);
export const apiUpdateLocal = (cod_local: number, data: any) =>
  request('post', apiProtected(`/locais/${cod_local}`), data, { method: 'PUT' as any });
export const apiDeleteLocal = (cod_local: number) =>
  request('get', apiProtected(`/locais/${cod_local}`), undefined, { method: 'DELETE' as any });
export const apiGetLocalBens = (cod_local: number) => request('get', apiProtected(`/locais/${cod_local}/bens`));
export const apiGetLocalContagem = (cod_local: number) =>
  request('get', apiProtected(`/locais/${cod_local}/contar-bens`));
