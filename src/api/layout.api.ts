import type { MenuList } from '../interface/layout/menu.interface';
import type { Notice } from '@/interface/layout/notice.interface';
import type { AxiosRequestConfig } from 'axios';

import { getStored } from '@/utils/notifications';

import { request } from './request';

/** Menu estático para navegação lateral (controlado no frontend) */
export const getMenuList = async (_config: AxiosRequestConfig = {}) => {
  const menu: MenuList = [
    { code: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    {
      code: 'catalogo',
      label: 'Catálogo',
      icon: 'documentation',
      path: '/catalogo',
      children: [
        { code: 'catalogoBens', label: 'Bens', path: '/catalogo/bens' },
        { code: 'catalogoCategorias', label: 'Categorias', path: '/catalogo/categorias' },
        { code: 'catalogoLocais', label: 'Locais', path: '/catalogo/locais' },
        { code: 'catalogoTransferencias', label: 'Transferências', path: '/transferencias' },
      ],
    },
    {
      code: 'admin',
      label: 'Admin',
      icon: 'permission',
      path: '/admin',
      children: [
        { code: 'adminBens', label: 'Bens', path: '/admin/bens' },
        { code: 'adminCategorias', label: 'Categorias', path: '/admin/categorias' },
        { code: 'adminLocais', label: 'Locais', path: '/admin/locais' },
        { code: 'adminSetores', label: 'Setores', path: '/admin/setores' },
        { code: 'adminImportacaoLote', label: 'Importação PDF', path: '/admin/importacao/lote' },
        { code: 'transferenciasExecutar', label: 'Executar Transferência', path: '/transferencias/executar' },
        { code: 'usersList', label: 'Usuários', path: '/users/list' },
        { code: 'userRegister', label: 'Cadastrar Usuário', path: '/users/register' },
      ],
    },
  ];

  return { status: true, message: 'success', result: menu } as any;
};

/** Lista de notificações (mock) */
/** Provides the mock notification list to be shown
 * in the notification dropdown
 */
export const getNoticeList = (_config: AxiosRequestConfig = {}) => {
  const list = getStored();

  return Promise.resolve({ status: true, message: 'success', result: list as Notice[] } as any);
};
