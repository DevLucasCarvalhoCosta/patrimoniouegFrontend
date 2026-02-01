// Interfaces para o sistema de importação de bens via PDF

export type ImportacaoStatus = 'PARSED' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
export type ImportacaoBemItemStatus = 'PENDING' | 'READY' | 'DUPLICATE' | 'ERROR' | 'CREATED';

export interface ImportacaoBem {
  id: string;
  arquivo_nome: string;
  arquivo_mime: string;
  arquivo_tamanho?: number;
  status: ImportacaoStatus;
  total_linhas: number;
  criadas: number;
  ignoradas: number;
  com_erro: number;
  created_at: string;
  updated_at: string;
  usuario: {
    id_usuario: number;
    nome: string;
    email: string;
  };
}

export interface ImportacaoBemItem {
  id: string;
  importacao_id: string;
  row_index: number;

  // Dados extraídos do PDF
  local_nome: string;
  descricao: string;
  especie?: string;
  classe?: string;
  numero_patrimonio: string;
  numero_serie?: string;
  marca?: string;
  estado_conservacao?: string;
  valor_atual_raw?: string;
  valor_aquisicao_raw?: string;
  observacoes?: string;

  // Dados normalizados
  valor_atual?: number;
  valor_aquisicao?: number;
  cod_categoria?: number;
  cod_local?: number;

  // Status e controle
  status: ImportacaoBemItemStatus;
  mensagem_erro?: string;
  created_at: string;
  updated_at?: string;

  // Dados relacionados para exibição
  categoria?: {
    cod_categoria: number;
    nome_categoria: string;
  };
  local?: {
    cod_local: number;
    nome_local: string;
    setor?: {
      nome_setor: string;
    };
  };
}

export interface EstatisticasImportacao {
  total_importacoes: number;
  total_bens_importados: number;
  importacoes_pendentes: number;
  importacoes_hoje: number;
  importacoes_semana: number;
  por_status: Array<{
    status: ImportacaoStatus;
    total: number;
  }>;
  usuarios_mais_ativos: Array<{
    id_usuario: number;
    nome: string;
    total_importacoes: number;
  }>;
}

export interface MapeamentoLocal {
  local_original: string;
  cod_local?: number;
  qtd_itens: number;
  sugestoes?: Array<{
    cod_local: number;
    nome_local: string;
    similaridade: number;
  }>;
}

export interface MapeamentoCategoria {
  classe_original: string;
  cod_categoria?: number;
  qtd_itens: number;
  sugestoes?: Array<{
    cod_categoria: number;
    nome_categoria: string;
    similaridade: number;
  }>;
}

export interface FiltrosItens {
  status: ImportacaoBemItemStatus[];
  busca: string;
  localMapeado: boolean | null;
  categoriaMapeada: boolean | null;
  comErro: boolean | null;
}

export interface ResultadoUpload {
  importacao_id: string;
  arquivo_nome: string;
  total_linhas: number;
  status: ImportacaoStatus;
  message: string;
}

export interface DadosNormalizacao {
  mapeamentos_locais: MapeamentoLocal[];
  mapeamentos_categorias: MapeamentoCategoria[];
  total_problemas: number;
  pode_confirmar: boolean;
}

export interface ResultadoConfirmacao {
  bens_criados: number;
  bens_ignorados: number;
  erros: Array<{
    item_id: string;
    numero_patrimonio?: string;
    erro: string;
  }>;
  message: string;
}

export interface ImportacaoFilters {
  status?: ImportacaoStatus[];
  data_inicio?: string;
  data_fim?: string;
  usuario?: number;
  busca?: string;
  page?: number;
  limit?: number;
}

// === NOVAS INTERFACES PARA IMPORTAÇÃO EM LOTE ===

export interface BemImportacao {
  numero_patrimonio: string;
  nome_bem: string;
  descricao?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  valor_aquisicao?: number;
  valor_atual?: number;
  data_aquisicao?: string;
  estado_conservacao?: string; // 'novo' | 'bom' | 'regular' | 'ruim' | 'péssimo'
  observacoes?: string;
  local: LocalImportacao;
  categoria: CategoriaImportacao;
}

export interface LocalImportacao {
  nome_local: string;
  tipo_local?: string;
  descricao?: string;
  andar?: string;
  bloco?: string;
  setor: SetorImportacao;
}

export interface CategoriaImportacao {
  nome_categoria: string;
  descricao?: string;
  codigo_categoria?: string;
}

export interface SetorImportacao {
  nome_setor: string;
  descricao?: string;
  responsavel?: string;
}

export interface ValidacaoImportacao {
  bens: BemImportacao[];
  validacao_duplicatas: boolean;
}

export interface ResultadoValidacao {
  message: string;
  validacao: {
    total_bens: number;
    validos: number;
    invalidos: number;
    duplicatas: number;
    itens: Array<{
      index: number;
      numero_patrimonio: string;
      valido: boolean;
      erros: string[];
      avisos: string[];
      duplicata: boolean;
      local_existe: boolean;
      categoria_existe: boolean;
      setor_existe: boolean;
    }>;
    relacionamentos_necessarios: {
      categorias_criar: string[];
      locais_criar: string[];
      setores_criar: string[];
    };
  };
}

export interface ResultadoImportacaoLote {
  message: string;
  resultado: {
    total_processados: number;
    criados: number;
    ignorados: number;
    com_erro: number;
    setores_criados: number;
    locais_criados: number;
    categorias_criadas: number;
    detalhes: {
      bens_criados: string[];
      bens_ignorados: string[];
      bens_com_erro: string[];
    };
  };
}

export interface DadosPDFExtraidos {
  texto_extraido: string;
  bens_detectados: BemImportacao[];
  estatisticas: {
    total_bens: number;
    campos_preenchidos: {
      numero_patrimonio: number;
      nome_bem: number;
      marca: number;
      modelo: number;
      numero_serie: number;
    };
  };
}
