# 🏛️ UEG Patrimonial - Sistema de Gestão Patrimonial

<p align="center">
  <strong>Sistema de Controle Patrimonial desenvolvido para a Universidade Estadual de Goiás (UEG)</strong>
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-objetivo">Objetivo</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-licença">Licença</a>
</p>

---

## 📋 Sobre o Projeto

O **UEG Patrimonial** é uma aplicação web moderna desenvolvida para automatizar e centralizar o controle de bens patrimoniais da Universidade Estadual de Goiás. O sistema permite o gerenciamento completo do ciclo de vida dos ativos institucionais, desde o cadastro inicial até a baixa, incluindo transferências entre setores e locais.

A plataforma foi criada para substituir processos manuais e planilhas descentralizadas, oferecendo uma solução integrada, segura e de fácil utilização para gestores, administradores e usuários operacionais da universidade.

## 🎯 Objetivo

### Objetivo Geral
Fornecer uma ferramenta digital eficiente para o **controle, rastreamento e gestão de bens patrimoniais** da UEG, garantindo transparência, conformidade com normas públicas e otimização dos processos administrativos.

### Objetivos Específicos
- **Centralizar informações**: Unificar dados de todos os bens patrimoniais em uma única plataforma acessível
- **Automatizar processos**: Eliminar processos manuais sujeitos a erros humanos
- **Garantir rastreabilidade**: Manter histórico completo de movimentações e alterações
- **Facilitar auditorias**: Disponibilizar relatórios detalhados para prestação de contas
- **Integrar dados públicos**: Conectar-se ao Portal de Dados Abertos do Estado de Goiás (CKAN)
- **Controlar acessos**: Implementar níveis de permissão adequados a cada perfil de usuário

## ✨ Funcionalidades

### 📊 Dashboard e Indicadores
- Visão geral do patrimônio com gráficos interativos
- Estatísticas de bens por categoria, local e setor
- Valores totais de aquisição e valores atuais
- Linha do tempo de movimentações recentes
- Resumo de transferências pendentes e realizadas

### 📦 Gestão de Bens
- **Catálogo Público**: Visualização de bens em modo card ou lista com filtros avançados
- **Administração Completa**: CRUD completo de bens patrimoniais
- **Busca Avançada**: Filtros por status, categoria, local, setor, datas e texto livre
- **Upload de Imagens**: Anexar fotos e documentos aos bens
- **Baixa de Bens**: Processo de baixa com registro de motivo e histórico
- **Exclusão em Massa**: Remoção de múltiplos registros com confirmação segura

### 🔄 Transferências Patrimoniais
- Solicitação de transferência de bens entre setores/locais
- Fluxo de aprovação para movimentações
- Histórico completo de transferências por bem
- Notificações automáticas sobre movimentações
- Relatórios de transferências por período

### 📥 Importação de Dados
- **Importação via PDF**: Upload e processamento de documentos patrimoniais
- **Integração Open Data**: Importação direta do Portal de Dados Abertos de Goiás
- **Importação em Lote**: Processamento de múltiplos registros simultaneamente
- **Validação Automática**: Verificação de duplicidades e inconsistências
- **Mapeamento de Campos**: Conversão automática de formatos externos

### 📁 Gestão de Categorias, Locais e Setores
- Cadastro e manutenção de categorias de bens
- Gerenciamento de locais físicos (prédios, salas, etc.)
- Administração de setores organizacionais
- Upload de imagens para categorias
- Hierarquia e organização estruturada

### 👥 Gestão de Usuários
- Cadastro e manutenção de usuários do sistema
- Perfis de acesso (Administrador e Usuário comum)
- Controle de permissões por funcionalidade
- Fluxo de senha temporária para novos usuários
- Histórico de ações por usuário

### 📄 Relatórios e Exportações
- **Exportação PDF**: Relatórios institucionais com logomarca e formatação padrão
- **Exportação Excel**: Planilhas detalhadas com estilos profissionais
- Relatórios por categoria, local, setor e período
- Documentos prontos para impressão e arquivamento

### 🔔 Sistema de Notificações
- Alertas sobre operações realizadas
- Histórico de notificações persistente
- Notificações de transferências pendentes
- Feedback visual imediato para ações do usuário

### 🌓 Personalização
- Tema claro e escuro
- Interface responsiva (desktop e mobile)
- Preferências salvas por usuário
- Layout adaptável com menu retrátil

## 🔐 Segurança

- **Autenticação JWT**: Tokens seguros com expiração automática
- **Controle de Acesso**: Rotas protegidas por perfil de usuário
- **Logout Automático**: Encerramento de sessão por inatividade
- **Validação de Dados**: Verificação client-side e server-side
- **Auditoria**: Registro de operações críticas

## 🚀 Tecnologias

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18 | Biblioteca para interfaces de usuário |
| TypeScript | 5 | Superset tipado de JavaScript |
| Vite | 6 | Build tool de próxima geração |
| Ant Design | 5 | Biblioteca de componentes UI |
| Redux Toolkit | - | Gerenciamento de estado global |
| React Router | 7 | Roteamento SPA |
| Axios | - | Cliente HTTP |
| Recharts | - | Biblioteca de gráficos |
| Less | - | Pré-processador CSS |
| Day.js | - | Manipulação de datas |

### Infraestrutura
- **Nginx**: Servidor web e proxy reverso
- **Docker**: Containerização da aplicação
- **Bitbucket Pipelines**: CI/CD automatizado
- **Vercel**: Deploy de preview (opcional)

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

## 🔧 Instalação

```bash
# Clonar o repositório
git clone https://github.com/DevLucasCarvalhoCosta/patrimoniouegFrontend.git

# Entrar no diretório
cd patrimoniouegFrontend

# Instalar dependências
npm install
```

## 🏃 Executando

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_BASE=http://localhost:3000
VITE_DEV_API_TARGET=https://patrimonioueg.duckdns.org
```

## 📁 Estrutura do Projeto

```
src/
├── api/          # Chamadas de API e endpoints
├── assets/       # Recursos estáticos (imagens, ícones)
├── components/   # Componentes reutilizáveis
│   ├── basic/    # Componentes básicos (inputs, buttons, modals)
│   ├── business/ # Componentes de negócio (importação, transferência)
│   └── common/   # Componentes comuns (exportação, loading)
├── config/       # Configurações da aplicação
├── hooks/        # Custom hooks React
├── interface/    # Tipos e interfaces TypeScript
├── pages/        # Páginas da aplicação
│   ├── admin/    # Módulos administrativos
│   ├── catalogo/ # Catálogo público
│   ├── dashboard/# Painel principal
│   └── ...       # Outras páginas
├── routes/       # Configuração de rotas e proteção
├── services/     # Serviços HTTP
├── stores/       # Redux stores e slices
├── styles/       # Estilos globais Less
└── utils/        # Utilitários e helpers
```

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa o linter |
| `npm run lint:fix` | Corrige problemas do linter |
| `npm run format` | Formata código com Prettier |

## 🧪 Testes

O projeto inclui testes end-to-end automatizados com Selenium:

```bash
# Os testes estão localizados em tests/selenium/
# Cobrem: login, bens, categorias, locais, setores, transferências
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 👥 Público-Alvo

- **Gestores Patrimoniais**: Controle total sobre bens e movimentações
- **Administradores de Sistema**: Gerenciamento de usuários e configurações
- **Servidores**: Consulta e solicitação de transferências
- **Auditores**: Acesso a relatórios e históricos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido para a <strong>Universidade Estadual de Goiás (UEG)</strong>
</p>
