import { apiProtected } from '@/config/api';

import { request } from './request';

export const apiListSetores = () => request('get', apiProtected('/setores'));
export const apiGetSetor = (cod_setor: number) => request('get', apiProtected(`/setores/${cod_setor}`));
export const apiCreateSetor = (data: any) => request('post', apiProtected('/setores'), data);
export const apiUpdateSetor = (cod_setor: number, data: any) =>
  request('post', apiProtected(`/setores/${cod_setor}`), data, { method: 'PUT' as any });
export const apiDeleteSetor = (cod_setor: number) =>
  request('get', apiProtected(`/setores/${cod_setor}`), undefined, { method: 'DELETE' as any });
