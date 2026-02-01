import { apiProtected } from '@/config/api';

import { request } from './request';

export const apiListCategoriasProtected = () => request('get', apiProtected('/categorias'));
export const apiCreateCategoria = (data: any) => request('post', apiProtected('/categorias'), data);
export const apiUpdateCategoria = (cod_categoria: number, data: any) =>
  request('post', apiProtected(`/categorias/${cod_categoria}`), data, { method: 'PUT' as any });
export const apiDeleteCategoria = (cod_categoria: number) =>
  request('get', apiProtected(`/categorias/${cod_categoria}`), undefined, { method: 'DELETE' as any });
export const apiGetCategoriaBens = (cod_categoria: number) =>
  request('get', apiProtected(`/categorias/${cod_categoria}/bens`));
export const apiGetCategoriaContagem = (cod_categoria: number) =>
  request('get', apiProtected(`/categorias/${cod_categoria}/contar-bens`));

export const apiUploadCategoriaImagens = (cod_categoria: number, arquivos: File[]) => {
  const form = new FormData();
  arquivos.forEach(f => form.append('imagens', f));
  return request('post', apiProtected(`/categorias/${cod_categoria}/imagens`), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const apiRemoverImagemCategoria = (cod_categoria: number, index: number) =>
  request('get', apiProtected(`/categorias/${cod_categoria}/imagens/${index}`), undefined, { method: 'DELETE' as any });
