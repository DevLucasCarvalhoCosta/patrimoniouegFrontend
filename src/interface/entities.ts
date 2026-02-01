// Backend entities (simplified)

export type Perfil = 'admin' | 'local' | 'user';

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: Perfil;
  cargo?: string;
  telefone?: string;
  cod_setor?: number;
}

export interface Categoria {
  cod_categoria: number;
  nome_categoria: string;
  descricao?: string;
  codigo_categoria?: string;
  ativo?: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
  imagem1?: string | null;
  imagem2?: string | null;
  imagem3?: string | null;
  imagem4?: string | null;
  imagem5?: string | null;
  imagem6?: string | null;
  imagem7?: string | null;
  imagem8?: string | null;
  imagem9?: string | null;
  imagem10?: string | null;
}

export interface Local {
  cod_local: number;
  nome_local: string;
  cod_setor: number;
  tipo_local?: string;
  descricao?: string;
  andar?: string;
  bloco?: string;
  ativo?: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
  setor?: {
    cod_setor?: number;
    nome_setor?: string;
    descricao?: string;
    sigla?: string;
    ativo?: boolean;
    data_criacao?: string;
    data_atualizacao?: string;
    id_responsavel?: number | null;
  };
}

export interface BemBase {
  cod_bem: number;
  numero_patrimonio: string;
  nome_bem: string;
  status: string;
  estado_conservacao?: string;
  descricao?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  valor_aquisicao?: string | number | null;
  valor_atual?: number | null;
  data_aquisicao?: string | null;
  observacoes?: string | null;
  cod_local: number;
  cod_categoria: number;
  peso?: string | number | null;
  cor?: string | null;
  material?: string | null;
  dimensoes?: string | null;
  movimentavel?: boolean;
  fornecedor?: string | null;
  numero_nota_fiscal?: string | null;
  data_garantia?: string | null;
  taxa_depreciacao?: string | number | null;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface Bem extends BemBase {
  local?: Local;
  categoria?: Categoria;
}

// === TRANSFERÊNCIAS ===

export interface Transferencia {
  cod_transferencia: number;
  cod_bem: number;
  cod_local_origem: number;
  cod_local_destino: number;
  id_usuario_responsavel: number;
  status: string;
  data_transferencia: string;
  motivo?: string;
  observacoes?: string;
  estado_conservacao_origem?: string;
  estado_conservacao_destino?: string;
  data_criacao: string;
  data_atualizacao: string;
  // Dados relacionados (como retornados pelo backend)
  bem?: {
    cod_bem: number;
    numero_patrimonio: string;
    nome_bem: string;
    descricao?: string;
    marca?: string;
    modelo?: string;
    valor_aquisicao?: string;
    data_aquisicao?: string;
    status: string;
    estado_conservacao?: string;
    cod_local: number;
    cod_categoria: number;
    categoria?: {
      cod_categoria: number;
      nome_categoria: string;
    };
  };
  localOrigem?: {
    cod_local: number;
    nome_local: string;
    tipo_local?: string;
    descricao?: string;
    andar?: string;
    bloco?: string;
    cod_setor: number;
    setor?: {
      cod_setor: number;
      nome_setor: string;
      sigla?: string;
    };
  };
  localDestino?: {
    cod_local: number;
    nome_local: string;
    tipo_local?: string;
    descricao?: string;
    andar?: string;
    bloco?: string;
    cod_setor: number;
    setor?: {
      cod_setor: number;
      nome_setor: string;
      sigla?: string;
    };
  };
  usuarioResponsavel?: {
    id_usuario: number;
    nome: string;
    cargo?: string;
    email: string;
    perfil: string;
  };
}

export interface ExecutarTransferenciaParams {
  cod_bem: number;
  cod_local_destino: number;
  motivo?: string;
  observacoes?: string;
}

export interface EstatisticasTransferencias {
  total_transferencias: number;
  transferencias_mes_atual: number;
  transferencias_mes_anterior: number;
  por_setor: Array<{
    cod_setor: number;
    nome_setor: string;
    total: number;
  }>;
  por_local: Array<{
    cod_local: number;
    nome_local: string;
    total: number;
  }>;
  top_bens_transferidos?: Array<{
    cod_bem: number;
    numero_patrimonio: string;
    nome_bem: string;
    total_transferencias: number;
  }>;
}
