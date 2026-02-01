import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import vitePluginImp from 'vite-plugin-imp';
import svgrPlugin from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devTarget = env.VITE_DEV_API_TARGET || 'https://patrimonioueg.duckdns.org';
  return {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
    server: {
    port: 8889,
    proxy: {
      '/api': {
        target: devTarget,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error:', err);
          });
        },
      },
      '/uploads': {
        target: devTarget,
        changeOrigin: true,
        secure: false,
      },
      '/ckan': {
        target: 'https://dadosabertos.go.gov.br',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/ckan/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('CKAN proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('CKAN proxy request to:', proxyReq.path);
          });
        },
      },
  },
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    vitePluginImp({
      libList: [
        // {
        //   libName: 'antd',
        //   style: name => `antd/es/${name}/style/index.css`,
        // },
        {
          libName: 'lodash',
          libDirectory: '',
          camel2DashComponentName: false,
          style: () => {
            return false;
          },
        },
      ],
    }),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
  ],
  };
});
