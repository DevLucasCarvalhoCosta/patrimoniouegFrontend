import type { Role } from './login';
import type { Device } from '@/interface/layout/index.interface';
import type { MenuChild } from '@/interface/layout/menu.interface';

export interface UserProfile {
  id: number;
  id_usuario: number; 
  nome: string;
  email: string;
  perfil: string;
  senha_temporaria?: boolean;
  primeiro_login?: boolean;
}

export interface UserState {
  username: string;
  userProfile?: UserProfile;

  /** menu list for init tagsView */
  menuList: MenuChild[];

  /** login status */
  logged: boolean;

  role: Role;

  /** user's device */
  device: Device;

  /** menu collapsed status */
  collapsed: boolean;

  /** notification count */
  noticeCount: number;

  /** Is first time to view the site ? */
  newUser: boolean;
}
