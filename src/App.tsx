import 'dayjs/locale/pt-br';

import { ConfigProvider, Spin, theme as antdTheme } from 'antd';
import ptBR from 'antd/es/locale/pt_BR';
import dayjs from 'dayjs';
import { Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { history, HistoryRouter } from '@/routes/history';

import RenderRouter from './routes';
import { setGlobalState } from './stores/global.store';

const App: React.FC = () => {
  const { theme, loading } = useSelector(state => state.global);
  const dispatch = useDispatch();

  const setTheme = (dark = true) => {
    dispatch(
      setGlobalState({
        theme: dark ? 'dark' : 'light',
      }),
    );
  };

  /** initial theme */
  useEffect(() => {
    setTheme(theme === 'dark');

    // watch system theme change
    if (!localStorage.getItem('theme')) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');

      function matchMode(e: MediaQueryListEvent) {
        setTheme(e.matches);
      }

      mql.addEventListener('change', matchMode);
    }
  }, []);

  // set the locale to Portuguese Brazil
  useEffect(() => {
    dayjs.locale('pt-br');
  }, []);

  /**
   * handler function that passes locale
   * information to ConfigProvider for
   * setting language across text components
   */
  const getAntdLocale = () => {
    return ptBR;
  };

  return (
    <ConfigProvider
      locale={getAntdLocale()}
      componentSize="middle"
      theme={{
        token: { colorPrimary: '#1d2362' },
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <HistoryRouter history={history}>
        <Suspense fallback={null}>
          <Spin
            spinning={loading}
            className="app-loading-wrapper"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.44)' : 'rgba(255, 255, 255, 0.44)',
            }}
            tip="Carregando..."
          ></Spin>
          <RenderRouter />
        </Suspense>
      </HistoryRouter>
    </ConfigProvider>
  );
};

export default App;
