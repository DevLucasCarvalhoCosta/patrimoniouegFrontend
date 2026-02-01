import 'driver.js/dist/driver.min.css';
import './index.less';

import Driver from 'driver.js';
import { useRef } from 'react';
import { useDispatch } from 'react-redux';

import { setUserItem } from '@/stores/user.store';

export const useGuide = () => {
  const dispatch = useDispatch();

  const driver = useRef(
    new Driver({
      keyboardControl: false,
      allowClose: false,
      overlayClickNext: true,
      closeBtnText: 'Fechar',
      prevBtnText: 'Anterior',
      nextBtnText: 'Próximo',
      doneBtnText: 'Concluído',
    }),
  );

  const driverStart = () => {
    setTimeout(() => {
      driver.current.defineSteps([
        {
          element: '#sidebar-trigger',
          popover: {
            title: 'Menu Lateral',
            description: 'Clique aqui para abrir/fechar o menu lateral',
            position: 'bottom',
            offset: 10,
            isFirst: true,
          },
        },
        {
          element: '#notice-center',
          popover: {
            title: 'Notificações',
            description: 'Aqui você pode ver suas notificações',
            position: 'bottom',
            offset: -160,
          },
        },
        {
          element: '#pageTabs .ant-tabs-nav.ant-tabs-nav-animated',
          popover: {
            title: 'Abas de Páginas',
            description: 'Estas são as abas das páginas que você visitou',
            position: 'bottom',
            offset: 30,
          },
        },
        {
          element: '#pageTabs-actions svg',
          popover: {
            title: 'Ações das Abas',
            description: 'Use estas opções para gerenciar suas abas',
            position: 'left',
          },
        },
        {
          element: '#switchTheme span',
          popover: {
            title: 'Trocar Tema',
            description: 'Clique aqui para alternar entre tema claro e escuro',
            position: 'left',
            isLast: true,
          },
        },
      ]);

      localStorage.setItem('newUser', 'false');
      dispatch(
        setUserItem({
          newUser: false,
        }),
      );
      driver.current.start();
      console.log('guide started');
    }, 1000);
  };

  return {
    driverStart,
  };
};

export default useGuide;
