# Relatório Técnico do Projeto Patrimonial Frontend

## 1. Visão Geral
- **Propósito**: entregar a interface web do sistema patrimonial da Universidade Estadual de Goiás, permitindo controle de bens, transferências e importações em massa, conforme observado nos fluxos de `src/pages`.
- **Stack principal**: React 17 com TypeScript, Redux Toolkit e Ant Design, empacotados com Vite (`package.json`, `vite.config.ts`).
- **Estrutura**: aplicação single-page hospedada em `/src`, organizada por domínios (`api`, `components`, `hooks`, `pages`, `stores`, `utils`). Conjuntos auxiliares incluem assets, estilos Less e tipagens em `/src/interface`.

## 2. Arquitetura de Alto Nível
- **Entrada**: `src/main.tsx` monta `App` com Redux e injeta `ConfigProvider` do AntD para i18n pt-BR, tema e `HistoryRouter` customizado (`src/routes/history.tsx`).
- **Rotas**: `src/routes/index.tsx` centraliza as rotas, usando `WrapperRouteComponent` para aplicar título, autenticação e regra de administrador via `PrivateRoute`.
- **Layout**: `src/pages/layout` define cabeçalho, menu lateral, sistema de abas e responsividade (colapso automático < 992 px). Menu de navegação vem de `getMenuList` (`src/api/layout.api.ts`), filtrado conforme perfil do usuário.
- **Estado Global**: `src/stores` combina slices de `user`, `global`, `tagsView` e `importacao`. Cada slice encapsula estado, reducers e side-effects com `createAsyncThunk`.
- **Comunicação HTTP**: `src/services/api.ts` instancia Axios. `src/api/request.ts` centraliza interceptores, token JWT, loading global com debounce e tratamento de erro (incluindo fallback HTML/CKAN). Helpers em `src/config/api.ts` produzem URLs normalizadas e apontam proxies (`vite.config.ts`).

## 3. Fluxo de Autenticação e Autorização
- **Login**: `src/pages/login/index.tsx` envia credenciais a `apiLogin`, grava token, perfil e e-mail (opcionalmente lembrado) no `localStorage` e atualiza `user.store`.
- **Validação contínua**: `ensureValidAuthOrRedirect` (`src/utils/auth.ts`) valida token e expiração a cada rota protegida; `forceLogout` centraliza limpeza de sessão.
- **Controle de acesso**: `PrivateRoute` barra usuários não autenticados, oferece fallback 403 com botão de retorno e, caso `adminOnly`, verifica `userProfile.perfil === 'admin'`.
- **Senha temporária**: usuários com `senha_temporaria` são forçados ao fluxo `/alterar-senha-temporaria`.

## 4. Domínios Funcionais
### 4.1 Dashboard e Indicadores
- `src/pages/dashboard` une componentes como `overview.tsx`, `salePercent.tsx` e `timeLine.tsx` para gráficos (Recharts) e estatísticas. Consome APIs de bens, categorias, locais e transferências (`src/api/*.api.ts`).
- `Overview` calcula agregados (valores de aquisição/atual) e evolução temporal com dayjs.

### 4.2 Catálogo de Bens
- `src/pages/catalogo/bens.tsx` exibe bens em modos card/lista, com filtros combináveis (status, datas, categoria, local, setor) e busca textual; combina parâmetros de URL e estado interno.
- Exportações usam `components/common/ExportButtons.tsx`, que delega para `utils/export/pdf.ts` (relatório institucional com logomarca, cabeçalho padrão) e `utils/export/xlsx.ts` (planilha com estilos).
- Integração com transferências: duplo clique abre `TransferenciaModal` e, se concluída, o hook `useBensRefreshListener` reconsulta dados.

### 4.3 Administração de Bens
- `src/pages/admin/bens.tsx` permite CRUD completo, baixa com motivo, exclusão (incluindo cascata) e exclusão em massa protegida por confirmação textual, chamando endpoints de `src/api/bens.api.ts`.
- Referenciais (categorias, locais, setores) são buscados uma única vez e cacheados em memória.
- Eventos relevantes geram notificações persistidas em `localStorage` via `utils/notifications.ts`.

### 4.4 Administração de Categorias, Locais e Setores
- Páginas como `src/pages/admin/categorias.tsx` e `src/pages/admin/locais.tsx` repetem o padrão: tabela filtrável, modais de criação/edição, upload/remoção de imagens (`apiUploadCategoriaImagens`, `apiRemoverImagemCategoria`).
- Atualizações disparam notificações padrão (create/update/delete) e mantêm histórico (`notifications.ts`).

### 4.5 Usuários e Perfis
- Rotas `/users/list` e `/users/register` (lazy carregadas em `routes/index.tsx`) consomem `api/user.api.ts` para operações administrativas.
- `user.store.ts` armazena `role`, `menuList`, `noticeCount` e preferências, recuperando valores persistidos com `getGlobalState`.

### 4.6 Transferências Patrimoniais
- APIs em `src/api/transferencias.api.ts` oferecem consultas gerais, por bem/local/setor e execução de transferências.
- Componentes como `TransferenciaModal` (em `components/business/transferencia`) recolhem destino, validam permissões e emitem notificações (`notifyTransferencia`).
- Dashboard apresenta `TransferenciasRecentesDashboard` consolidando as últimas movimentações.

### 4.7 Importação de Bens
- **Importação via PDF**: `src/stores/importacao.store.ts` centraliza fluxo (upload, listagem, normalização, mapeamentos, confirmação). Hooks em `src/hooks/useImportacao.ts` expõem dados e polling.
- **Importação Open Data CKAN**: `ImportacaoOpenDataModal` + hook `useImportacaoOpenData` buscarm registros no portal público via proxy `/ckan` (`vite.config.ts`, `nginx/app-patrimonio.conf`). Conversão usa `utils/opendata-mapper.ts` e validação/execução `apiValidarImportacaoLote`/`apiExecutarImportacaoLote`.
- Modal integra revisão tabular (`TabelaBensImportacao`) e só libera importação quando `validacao` retorna sem erros/duplicatas.

### 4.8 Exportação e Relatórios
- Padrão institucional replicado em PDF/Excel com metadados (órgão, unidade, situação) e opção de logotipo (`/public/ueghorizontal.PNG`).
- Exportações presentes em Catálogo, Administração e demais listas relevantes.

### 4.9 Notificações e UX
- `utils/notifications.ts` gerencia notificações persistentes, expondo utilitários para operações de usuário, bens e entidades.
- `stores/global.store.ts` controla tema (dark/light) sincronizado com `localStorage` e `prefers-color-scheme`; spinner global com debounce evita flickers.

## 5. Integrações Externas e Infraestrutura
- **CKAN**: proxys configurados em `vite.config.ts` (desenvolvimento) e `nginx/app-patrimonio.conf` (produção) reescrevem `/ckan` para `https://dadosabertos.go.gov.br` com CORS e tempo limite dedicados.
- **Backend API**: `/api` e `/uploads` redirecionados para o serviço Node/Express (`proxy_pass` no Nginx). Cabeçalhos CORS e preflight padronizados.
- **CI/CD**: `bitbucket-pipelines.yml` instala dependências, executa `npm run build`, sincroniza artefatos via SSH/SCP e reinicia container Docker remoto.
- **Deploy**: saída `dist/` servida por Nginx; `vercel.json` ajusta comportamento de preview (quando aplicável).

## 6. Qualidade e Testes
- **Testes End-to-End**: `tests/selenium/*.test.js` automatizam cenários críticos (login, catálogo, categorias, locais, transferências) usando Selenium + Mocha + Chromedriver.
- **Lint/Format**: scripts `npm run lint` e `npm run format` garantem padrões ESLint/Prettier (`devDependencies`).
- **Feedback Visual**: mensagens AntD, modal de confirmação e loading global fornecem retorno imediato, reduzindo falhas silenciosas.

## 7. Segurança e Governança
- Tokens JWT armazenados em `localStorage`, enviados automaticamente nas rotas protegidas via interceptor (`Authorization: Bearer`).
- Logout forçado em 401, expiração ou ação do usuário limpa storage e redireciona (`forceLogout`).
- Rotas marcadas com `adminOnly` impedem administradores falsos, exibindo 403 com atalho para dashboard.
- Downloads e uploads usam validações (tipos, tamanho) no frontend (`CategoriaImagensManager`), minimizando riscos client-side.

## 8. Observações sobre Evolução e Fases
1. **Fase de Fundamentos (Setup & Infra)**: configuração do Vite, aliases `@`, Provider Redux e theming AntD (`src/main.tsx`, `vite.config.ts`).
2. **Fase de Autenticação e Layout**: implementação do `PrivateRoute`, `utils/auth.ts`, páginas de login e layout responsivo com menu dinâmico e tags (`src/pages/login`, `src/pages/layout`).
3. **Fase de Gestão Patrimonial**: construção de módulos catálogo/admin, integração com APIs de bens/categorias/locais e criação de notificações persistentes (`src/pages/catalogo/bens.tsx`, `src/pages/admin/bens.tsx`, `utils/notifications.ts`).
4. **Fase de Transferências e Dashboard**: adição de indicadores gráficos, listagem de transferências e modal de movimentação (`src/pages/dashboard`, `components/business/transferencia`).
5. **Fase de Importação & Automação**: criação do slice `importacao.store.ts`, componentes `components/business/importacao/*`, integração CKAN e mapeamento de datasets (`hooks/useImportacaoOpenData.ts`, `utils/opendata-mapper.ts`).
6. **Fase de Polimento e Deploy**: exportação customizada (PDF/XLSX), testes Selenium e pipeline Bitbucket com scripts de deploy, além de ajustes de Nginx e configurações `vercel.json`.

Essa progressão evidencia a maturação incremental: partindo de infraestrutura e segurança, avançando para operações core, automação de entrada de dados e finalizando com governança operacional.

## 9. Próximos Passos Sugeridos
- Cobrir com testes automatizados os fluxos de importação (PDF/CKAN) e exclusão em massa, garantindo regressão mínima.
- Externalizar parâmetros sensíveis (hosts, portas) para `.env` documentado, evitando dados fixos na pipeline.
- Considerar migração para React 18/Redux Toolkit mais recente e atualização dos pacotes AntD para garantir suporte prolongado.

---
Relatório elaborado com base no código existente em novembro/2025, refletindo a implementação atual do repositório `patrimonial-frontend`.
