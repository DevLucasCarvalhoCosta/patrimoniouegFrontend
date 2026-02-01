import type { LoginParams, LoginResult, LogoutParams, LogoutResult, RegisterParams } from '../interface/user/login';

import { apiAuth, apiProtected } from '@/config/api';

import { request } from './request';

/** Login */
export const apiLogin = (data: LoginParams) => request<LoginResult>('post', apiAuth('/login'), data);

/** Logout */
export const apiLogout = (data: LogoutParams) => request<LogoutResult>('post', apiAuth('/logout'), data);

/** Perfil do usuário autenticado */
export const apiGetUserProfile = () => request('get', apiProtected('/perfil'));

/** Lista todos usuários (admin) */
export const apiGetAllUsers = () => request('get', apiProtected('/admin/usuarios'));

/** Cadastro de novo usuario (admin) */
export const apiRegister = (data: RegisterParams) => request('post', apiAuth('/register'), data);

export const apiAlterarSenhaTemporaria = (data: {
	senha_atual: string;
	nova_senha: string;
	confirmar_senha: string;
}) => request('post', apiAuth('/alterar-senha-temporaria'), data);

/** Editar usuario (admin) */
export const apiEditUser = (id: number, data: Partial<RegisterParams>) => request('put', apiProtected(`/admin/usuarios/${id}`), data);

/** Excluir usuario (admin) */
export const apiDeleteUser = (id: number) => request('delete', apiProtected(`/admin/usuarios/${id}`));
