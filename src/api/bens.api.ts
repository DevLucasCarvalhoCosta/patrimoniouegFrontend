import { apiProtected } from '@/config/api';

import { request } from './request';

// Protected bens endpoints (auth required)
export const apiListBensTangiveis = () => request('get', apiProtected('/bens/tangiveis'));
export const apiListBensIntangiveis = () => request('get', apiProtected('/bens/intangiveis'));
export const apiGetBensEstatisticas = () => request('get', apiProtected('/bens-estatisticas'));
export const apiCreateBemTangivel = (data: any) => request('post', apiProtected('/bens/tangivel'), data);
export const apiCreateBemIntangivel = (data: any) => request('post', apiProtected('/bens/intangivel'), data);
export const apiUpdateBem = (cod_bem: number, data: any) =>
  request('post', apiProtected(`/bens/${cod_bem}`), data, { method: 'PUT' as any });
// Single delete: now hard delete, returns 204 No Content
export const apiDeleteBem = (cod_bem: number) => request('delete', apiProtected(`/bens/${cod_bem}`));

// Cascade delete: deletes transferências then the bem (200 JSON)
export const apiDeleteBemCascade = (cod_bem: number) => request('delete', apiProtected(`/bens/${cod_bem}/cascade`));

// Baixa (inativar sem excluir fisicamente)
export const apiBaixarBem = (cod_bem: number, data?: { observacoes?: string }) =>
  request('patch', apiProtected(`/bens/${cod_bem}/baixa`), data);

// Mass delete (hard delete bens ATIVOS) - admin only with explicit confirmation
export const apiExcluirTodosBens = (confirmacao: string) =>
  request('delete', apiProtected('/bens/excluir-todos'), { confirmacao });
