import type { FC } from 'react';
import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router';
import { useRoutes } from 'react-router-dom';

import Dashboard from '@/pages/dashboard';
import LayoutPage from '@/pages/layout';
import LoginPage from '@/pages/login';

import WrapperRouteComponent from './config';

const NotFound = lazy(() => import(/* webpackChunkName: "404'"*/ '@/pages/404'));
const UsersList = lazy(() => import(/* webpackChunkName: "users-list" */ '@/pages/users/list'));
const UserRegister = lazy(() => import(/* webpackChunkName: "user-register" */ '@/pages/users/register'));
const CatalogoBens = lazy(() => import(/* webpackChunkName: "catalogo-bens" */ '@/pages/catalogo/bens'));
const CatalogoCategorias = lazy(
  () => import(/* webpackChunkName: "catalogo-categorias" */ '@/pages/catalogo/categorias'),
);
const CatalogoLocais = lazy(() => import(/* webpackChunkName: "catalogo-locais" */ '@/pages/catalogo/locais'));
const AdminBens = lazy(() => import(/* webpackChunkName: "admin-bens" */ '@/pages/admin/bens'));
const AdminCategorias = lazy(() => import(/* webpackChunkName: "admin-categorias" */ '@/pages/admin/categorias'));
const AdminLocais = lazy(() => import(/* webpackChunkName: "admin-locais" */ '@/pages/admin/locais'));
const AdminSetores = lazy(() => import(/* webpackChunkName: "admin-setores" */ '@/pages/admin/setores'));
const ImportacaoLotePage = lazy(
  () => import(/* webpackChunkName: "admin-importacao-lote" */ '@/pages/admin/importacao/lote'),
);
const TransferenciasPage = lazy(() => import(/* webpackChunkName: "transferencias" */ '@/pages/transferencias'));
const ExecutarTransferenciaPage = lazy(
  () => import(/* webpackChunkName: "executar-transferencia" */ '@/pages/transferencias/executar'),
);
const AlterarSenhaTemporariaPage = lazy(
  () => import(/* webpackChunkName: "alterar-senha-temporaria" */ '@/pages/auth/alterar-senha-temporaria'),
);

const RootRedirect: FC = () => {
  const { logged } = useSelector((state: any) => state.user);

  return <Navigate to={logged ? '/dashboard' : '/login'} replace />;
};

const routeList: RouteObject[] = [
  {
    path: '/login',
    element: <WrapperRouteComponent element={<LoginPage />} title="Login" />,
  },
  {
    index: true,
    element: <RootRedirect />,
  },
  {
    path: '/',
    element: <WrapperRouteComponent element={<LayoutPage />} title="" auth={true} />,
    children: [
      {
        path: 'dashboard',
        element: <WrapperRouteComponent element={<Dashboard />} title="Dashboard" />,
      },
      
      
      {
        path: 'users/list',
        element: (
          <WrapperRouteComponent element={<UsersList />} title="Lista de Usuários" auth={true} adminOnly={true} />
        ),
      },
      {
        path: 'users/register',
        element: (
          <WrapperRouteComponent element={<UserRegister />} title="Cadastro de Usuário" auth={true} adminOnly={true} />
        ),
      },
      {
        path: 'catalogo/bens',
        element: <WrapperRouteComponent element={<CatalogoBens />} title="Catálogo de Bens" />,
      },
      {
        path: 'catalogo/categorias',
        element: <WrapperRouteComponent element={<CatalogoCategorias />} title="Categorias" />,
      },
      {
        path: 'catalogo/locais',
        element: <WrapperRouteComponent element={<CatalogoLocais />} title="Locais" />,
      },
      {
        path: 'admin/bens',
        element: <WrapperRouteComponent element={<AdminBens />} title="Bens (Admin)" auth={true} adminOnly={true} />,
      },
      {
        path: 'admin/categorias',
        element: (
          <WrapperRouteComponent
            element={<AdminCategorias />}
            title="Categorias (Admin)"
            auth={true}
            adminOnly={true}
          />
        ),
      },
      {
        path: 'admin/locais',
        element: (
          <WrapperRouteComponent element={<AdminLocais />} title="Locais (Admin)" auth={true} adminOnly={true} />
        ),
      },
      {
        path: 'admin/setores',
        element: (
          <WrapperRouteComponent element={<AdminSetores />} title="Setores (Admin)" auth={true} adminOnly={true} />
        ),
      },
      {
        path: 'admin/importacao/lote',
        element: (
          <WrapperRouteComponent
            element={<ImportacaoLotePage />}
            title="Importação em Lote"
            auth={true}
            adminOnly={true}
          />
        ),
      },
      {
        path: 'transferencias',
        element: <WrapperRouteComponent element={<TransferenciasPage />} title="Transferências de Bens" auth={true} />,
      },
      {
        path: 'transferencias/executar',
        element: (
          <WrapperRouteComponent
            element={<ExecutarTransferenciaPage />}
            title="Executar Transferência"
            auth={true}
            adminOnly={true}
          />
        ),
      },
      {
        path: 'alterar-senha-temporaria',
        element: (
          <WrapperRouteComponent
            element={<AlterarSenhaTemporariaPage />}
            title="Alterar Senha Temporária"
            auth={true}
          />
        ),
      },
  {},
    ],
  },
  {
    path: '*',
    element: <WrapperRouteComponent element={<NotFound />} title="Página não encontrada" />,
  },
];

const RenderRouter: FC = () => {
  const element = useRoutes(routeList);

  return element;
};

export default RenderRouter;
