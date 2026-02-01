import type { LoginParams } from '../interface/user/login';
import type { UserProfile } from '../interface/user/user';
import type { Dispatch } from '@reduxjs/toolkit';

import { apiLogin, apiLogout } from '../api/user.api';
import { setUserItem } from './user.store';
import { createAsyncAction } from './utils';
// typed wrapper async thunk function demo, no extra feature, just for powerful typings
export const loginAsync = createAsyncAction<LoginParams, boolean>(payload => {
  return async dispatch => {
    const response = await apiLogin(payload);

    if (response.status && response.result) {
      const { token, usuario } = response.result;

      // Mapear id para id_usuario para compatibilidade
      const usuarioMapeado = {
        ...usuario,
        id_usuario: usuario.id, // Garantir que id_usuario existe
      };

      localStorage.setItem('token', token);
      localStorage.setItem('userProfile', JSON.stringify(usuarioMapeado));
      localStorage.setItem('username', usuario.nome);

      dispatch(
        setUserItem({
          logged: true,
          username: usuario.nome,
          userProfile: usuarioMapeado,
        }),
      );

      return true;
    }

    return false;
  };
});

export const logoutAsync = () => {
  return async (dispatch: Dispatch) => {
    // Limpar localStorage independentemente da resposta da API
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('username');

    dispatch(
      setUserItem({
        logged: false,
        username: '',
        userProfile: undefined,
      }),
    );

    return true;
  };
};
