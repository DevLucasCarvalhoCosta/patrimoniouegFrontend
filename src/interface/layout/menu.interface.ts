interface MenuItem {
  /** menu item code */
  code: string;
  /** menu label */
  label: string;
  /** icon name (submenus may omit this) */
  icon?: string;
  /** route path */
  path: string;
  /** children */
  children?: MenuItem[];
}

export type MenuChild = Omit<MenuItem, 'children'>;

export type MenuList = MenuItem[];
