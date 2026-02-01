import { apiPublic } from '@/config/api';

import { request } from './request';

// Public routes (no auth)
export const apiListBens = () => request('get', apiPublic('/bens'));
export const apiGetBem = (cod_bem: number) => request('get', apiPublic(`/bens/${cod_bem}`));

export const apiListCategorias = () => request('get', apiPublic('/categorias'));
export const apiGetCategoria = (cod_categoria: number) => request('get', apiPublic(`/categorias/${cod_categoria}`));

export const apiListLocais = () => request('get', apiPublic('/locais'));
export const apiGetLocal = (cod_local: number) => request('get', apiPublic(`/locais/${cod_local}`));
