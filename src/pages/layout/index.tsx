import type { MenuChild, MenuList } from '@/interface/layout/menu.interface';
import type { FC } from 'react';

import './index.less';

import { Drawer, Layout, theme as antTheme } from 'antd';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router';

import { getMenuList } from '@/api/layout.api';
import { setUserItem } from '@/stores/user.store';
import { getFirstPathCode } from '@/utils/getFirstPathCode';
import { getGlobalState } from '@/utils/getGloabal';

import { useGuide } from '../guide/useGuide';
import HeaderComponent from './header';
import MenuComponent from './menu';
import TagsView from './tagView';

const { Sider, Content } = Layout;
const WIDTH = 992;

const LayoutPage: FC = () => {
  const location = useLocation();
  const [openKey, setOpenkey] = useState<string>();
  const [selectedKey, setSelectedKey] = useState<string>(location.pathname);
  const [menuList, setMenuList] = useState<MenuList>([]);
  const { device, collapsed, newUser, userProfile } = useSelector((state: any) => state.user);
  const token = antTheme.useToken();

  const isMobile = device === 'MOBILE';
  const dispatch = useDispatch();
  const { driverStart } = useGuide();

  const filterMenuByProfile = (menu: MenuList): MenuList => {
    const isAdmin = userProfile?.perfil === 'admin';

    return (
      menu?.filter(item => {
        if ((item.code === 'users' || item.code === 'admin') && !isAdmin) {
          return false;
        }

        if (item.children) {
          item.children = item.children.filter(child => {
            if (child.code === 'transferenciasExecutar' && !isAdmin) {
              return false;
            }

            return true;
          });
        }

        return true;
      }) || []
    );
  };

  useEffect(() => {
    const path = location.pathname;
    const parent = menuList.find(m => m.children?.some(c => c.path === path));
    const code = parent?.code || getFirstPathCode(path);

    setOpenkey(code);
    setSelectedKey(path);
  }, [location.pathname, menuList]);

  const toggle = () => {
    dispatch(
      setUserItem({
        collapsed: !collapsed,
      }),
    );
  };

  const initMenuListAll = (menu: MenuList) => {
    const MenuListAll: MenuChild[] = [];

    menu.forEach(m => {
      if (!m?.children?.length) {
        MenuListAll.push(m);
      } else {
        m?.children.forEach(mu => {
          MenuListAll.push(mu);
        });
      }
    });

    return MenuListAll;
  };

  const fetchMenuList = useCallback(async () => {
    const { status, result } = await getMenuList();

    if (status) {
  // Ajuste simples de rótulos
      const normalizeMenuLabels = (menu: MenuList): MenuList => {
        return menu.map(item => {
          const cloned = { ...item } as any;

          if (cloned.code === 'adminImportacaoLote' || cloned.path === '/admin/importacao/lote') {
            cloned.label = 'Importação em Lote';
          }

          if (Array.isArray(cloned.children) && cloned.children.length) {
            cloned.children = normalizeMenuLabels(cloned.children as any) as any;
          }

          return cloned;
        });
      };

      const filteredMenu = filterMenuByProfile(normalizeMenuLabels(result));

      setMenuList(filteredMenu);
      dispatch(
        setUserItem({
          menuList: initMenuListAll(filteredMenu),
        }),
      );
    }
  }, [dispatch, userProfile]);

  useEffect(() => {
    fetchMenuList();
  }, [fetchMenuList]);

  useEffect(() => {
    window.onresize = () => {
      const { device } = getGlobalState();
      const rect = document.body.getBoundingClientRect();
      const needCollapse = rect.width < WIDTH;

      dispatch(
        setUserItem({
          device,
          collapsed: needCollapse,
        }),
      );
    };
  }, [dispatch]);

  useEffect(() => {
    newUser && driverStart();
  }, [newUser]);

  return (
    <Layout className="layout-page">
      <HeaderComponent collapsed={collapsed} toggle={toggle} />
      <Layout>
        {!isMobile ? (
          <Sider
            className="layout-page-sider"
            trigger={null}
            collapsible
            style={{ backgroundColor: token.token.colorBgContainer }}
            collapsedWidth={isMobile ? 0 : 80}
            collapsed={collapsed}
            breakpoint="md"
          >
            <MenuComponent
              menuList={menuList}
              openKey={openKey}
              onChangeOpenKey={k => setOpenkey(k)}
              selectedKey={selectedKey}
              onChangeSelectedKey={k => setSelectedKey(k)}
            />
          </Sider>
        ) : (
          <Drawer
            width="200"
            placement="left"
            bodyStyle={{ padding: 0, height: '100%' }}
            closable={false}
            onClose={toggle}
            open={!collapsed}
          >
            <MenuComponent
              menuList={menuList}
              openKey={openKey}
              onChangeOpenKey={k => setOpenkey(k)}
              selectedKey={selectedKey}
              onChangeSelectedKey={k => setSelectedKey(k)}
            />
          </Drawer>
        )}
        <Content className="layout-page-content">
          <TagsView />
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutPage;
