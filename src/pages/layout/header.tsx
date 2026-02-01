import type { FC } from 'react';

import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Layout, theme as antTheme, Tooltip } from 'antd';
import { createElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { ReactComponent as MoonSvg } from '@/assets/header/moon.svg';
import { ReactComponent as SunSvg } from '@/assets/header/sun.svg';
import { setGlobalState } from '@/stores/global.store';
import { setUserItem } from '@/stores/user.store';
import { forceLogout } from '@/utils/auth';

import HeaderNoticeComponent from './notice';

const { Header } = Layout;

interface HeaderProps {
  collapsed: boolean;
  toggle: () => void;
}

type Action = 'userInfo' | 'userSetting' | 'logout';

const HeaderComponent: FC<HeaderProps> = ({ collapsed, toggle }) => {
  const { logged, device, username, userProfile } = useSelector(state => state.user);
  const { theme } = useSelector(state => state.global);
  const navigate = useNavigate();
  const token = antTheme.useToken();
  const dispatch = useDispatch();
  const initial = ((userProfile?.nome || username || 'U').trim()[0] || 'U').toUpperCase();

  const onActionClick = async (action: Action) => {
    switch (action) {
      case 'userInfo':
        return;
      case 'userSetting':
        return;
      case 'logout':
        forceLogout('user');

        return;
    }
  };

  const toLogin = () => {
    navigate('/login');
  };

  const onChangeTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('theme', newTheme);
    dispatch(
      setGlobalState({
        theme: newTheme,
      }),
    );
  };

  return (
    <Header className="layout-page-header bg-2" style={{ backgroundColor: token.token.colorBgContainer }}>
      {device !== 'MOBILE' && (
        <div className="logo" style={{ width: collapsed ? 80 : 200 }}>
          <img
            src="/ueghorizontal.PNG"
            alt="UEG"
            style={{ maxWidth: '100%', height: 42, objectFit: 'contain' }}
            onError={e => {
              const t = e.currentTarget as HTMLImageElement;

              if (t.src.indexOf('/ueg.PNG') === -1) t.src = '/ueg.PNG';
            }}
          />
        </div>
      )}
      <div className="layout-page-header-main">
        <div onClick={toggle}>
          <span id="sidebar-trigger">{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</span>
        </div>
        <div className="actions">
          <Tooltip title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}>
            <span>
              {createElement(theme === 'dark' ? SunSvg : MoonSvg, {
                onClick: onChangeTheme,
              })}
            </span>
          </Tooltip>
          <HeaderNoticeComponent />

          {logged ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: '1',
                    icon: <UserOutlined />,
                    label: <span onClick={() => navigate('/dashboard')}>Conta</span>,
                  },
                  {
                    key: '2',
                    icon: <LogoutOutlined />,
                    label: <span onClick={() => onActionClick('logout')}>Sair</span>,
                  },
                ],
              }}
            >
              <span className="user-action">
                <Avatar
                  className="user-avator"
                  size={40}
                  style={{ backgroundColor: token.token.colorPrimary, color: '#fff', fontWeight: 600 }}
                >
                  {initial}
                </Avatar>
              </span>
            </Dropdown>
          ) : (
            <span style={{ cursor: 'pointer' }} onClick={toLogin}>
              Login
            </span>
          )}
        </div>
      </div>
    </Header>
  );
};

export default HeaderComponent;
