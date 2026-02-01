/** user's role */
export type Role = 'guest' | 'admin';

export interface LoginParams {
  /** e-mail do usuário */
  email: string;
  /** senha */
  senha: string;
  /** lembrar usuário (opcional) */
  remember?: boolean;
}

export interface LoginResult {
  /** auth token */
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
  senha_temporaria?: boolean;
  primeiro_login?: boolean;
  };
}

export interface RegisterParams {
  /** nome */
  nome: string;
  /** cargo */
  cargo: string;
  /** e-mail */
  email: string;
  /** senha */
  senha: string;
  /** telefone */
  telefone: string;
  /** código do setor */
  cod_setor: number;
  /** perfil */
  perfil: string;
}

export interface RegisterResult {
  message: string;
}

export interface LogoutParams {
  token: string;
}

export interface LogoutResult {}
