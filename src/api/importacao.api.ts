import type {
  BemImportacao,
  DadosNormalizacao,
  DadosPDFExtraidos,
  EstatisticasImportacao,
  ImportacaoBem,
  ImportacaoBemItem,
  ImportacaoFilters,
  ResultadoConfirmacao,
  ResultadoImportacaoLote,
  ResultadoUpload,
  ResultadoValidacao,
  ValidacaoImportacao,
} from '@/interface/importacao';

import { apiProtected } from '@/config/api';

import { request } from './request';

// === ENDPOINTS PRINCIPAIS ===

/** Upload de PDF para importação */
export const apiUploadPDFImportacao = (arquivo: File) => {
  const formData = new FormData();

  formData.append('pdf', arquivo);

  return request<ResultadoUpload>('post', apiProtected('/importacao/upload'), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Listar importações do usuário */
export const apiListImportacoes = (filters?: ImportacaoFilters) =>
  request<{ importacoes: ImportacaoBem[]; total: number }>('get', apiProtected('/importacao'), undefined, {
    params: filters,
  });

/** Obter detalhes de uma importação específica */
export const apiGetImportacao = (id: string) => request<ImportacaoBem>('get', apiProtected(`/importacao/${id}`));

/** Obter estatísticas gerais de importação */
export const apiGetEstatisticasImportacao = () =>
  request<EstatisticasImportacao>('get', apiProtected('/importacao-estatisticas'));

// === GERENCIAMENTO DE ITENS ===

/** Listar itens de uma importação */
export const apiGetItensImportacao = (
  importacaoId: string,
  filters?: {
    status?: string[];
    busca?: string;
    localMapeado?: boolean;
    categoriaMapeada?: boolean;
    page?: number;
    limit?: number;
  },
) =>
  request<{ itens: ImportacaoBemItem[]; total: number }>(
    'get',
    apiProtected(`/importacao/${importacaoId}/itens`),
    undefined,
    { params: filters },
  );

/** Reprocessar normalização de uma importação */
export const apiReprocessarNormalizacao = (importacaoId: string) =>
  request<DadosNormalizacao>('post', apiProtected(`/importacao/${importacaoId}/reprocessar`));

/** Obter dados de normalização (mapeamentos pendentes) */
export const apiGetDadosNormalizacao = (importacaoId: string) =>
  request<DadosNormalizacao>('get', apiProtected(`/importacao/${importacaoId}/normalizacao`));

/** Aplicar mapeamento de local */
export const apiAplicarMapeamentoLocal = (
  importacaoId: string,
  data: {
    local_original: string;
    cod_local: number;
  },
) => request('post', apiProtected(`/importacao/${importacaoId}/mapear-local`), data);

/** Aplicar mapeamento de categoria */
export const apiAplicarMapeamentoCategoria = (
  importacaoId: string,
  data: {
    classe_original: string;
    cod_categoria: number;
  },
) => request('post', apiProtected(`/importacao/${importacaoId}/mapear-categoria`), data);

// === CONFIRMAÇÃO E CONTROLE ===

/** Confirmar importação e criar bens na tabela definitiva */
export const apiConfirmarImportacao = (importacaoId: string) =>
  request<ResultadoConfirmacao>('post', apiProtected(`/importacao/${importacaoId}/confirmar`));

/** Cancelar importação */
export const apiCancelarImportacao = (importacaoId: string, motivo?: string) =>
  request('post', apiProtected(`/importacao/${importacaoId}/cancelar`), { motivo });

/** Excluir importação */
export const apiExcluirImportacao = (importacaoId: string) =>
  request('delete', apiProtected(`/importacao/${importacaoId}`));

// === DADOS AUXILIARES ===

/** Buscar locais para mapeamento */
export const apiGetLocaisParaMapeamento = (termo?: string) =>
  request<Array<{ cod_local: number; nome_local: string; setor?: { nome_setor: string } }>>(
    'get',
    apiProtected('/locais/busca'),
    undefined,
    { params: { termo } },
  );

/** Buscar categorias para mapeamento */
export const apiGetCategoriasParaMapeamento = (termo?: string) =>
  request<Array<{ cod_categoria: number; nome_categoria: string; codigo_categoria?: string }>>(
    'get',
    apiProtected('/categorias/busca'),
    undefined,
    { params: { termo } },
  );

/** Verificar se patrimônio já existe */
export const apiVerificarPatrimonio = (numero_patrimonio: string) =>
  request<{ existe: boolean; bem?: { cod_bem: number; nome_bem: string; local?: { nome_local: string } } }>(
    'get',
    apiProtected('/bens/verificar-patrimonio'),
    undefined,
    { params: { numero_patrimonio } },
  );

// === NOVOS ENDPOINTS PARA IMPORTAÇÃO EM LOTE ===

/** Validar importação em lote */
export const apiValidarImportacaoLote = (data: ValidacaoImportacao) =>
  request<ResultadoValidacao>('post', apiProtected('/importacao-lote/validar'), data);

/** Executar importação em lote */
export const apiExecutarImportacaoLote = (data: ValidacaoImportacao & { auto_criar_relacionamentos?: boolean }) =>
  request<ResultadoImportacaoLote>('post', apiProtected('/importacao-lote/executar'), data);

/** Criar bem individual */
export const apiCriarBemIndividual = (bem: BemImportacao) =>
  request<{ message: string; bem_id: number }>('post', apiProtected('/importacao-lote/bem'), bem);

/** Criar categoria */
export const apiCriarCategoria = (categoria: { nome_categoria: string; descricao?: string; codigo_categoria?: string }) =>
  request<{ message: string; categoria_id: number }>('post', apiProtected('/importacao-lote/categoria'), categoria);

/** Criar local */
export const apiCriarLocal = (local: {
  nome_local: string;
  tipo_local?: string;
  descricao?: string;
  andar?: string;
  bloco?: string;
  setor: { nome_setor: string; descricao?: string };
}) =>
  request<{ message: string; local_id: number }>('post', apiProtected('/importacao-lote/local'), local);

/** Criar setor */
export const apiCriarSetor = (setor: { nome_setor: string; descricao?: string; responsavel?: string }) =>
  request<{ message: string; setor_id: number }>('post', apiProtected('/importacao-lote/setor'), setor);

/** Obter estatísticas de importação em lote */
export const apiGetEstatisticasImportacaoLote = () =>
  request<{
    total_bens: number;
    por_categoria: Array<{ categoria: string; total: number }>;
    por_local: Array<{ local: string; total: number }>;
    por_setor: Array<{ setor: string; total: number }>;
    por_estado: Array<{ estado: string; total: number }>;
  }>('get', apiProtected('/importacao-lote/estatisticas'));

// === FUNÇÕES AUXILIARES PARA PROCESSAMENTO DE PDF ===

/** Processar PDF localmente e extrair dados estruturados */
export const processarPDFLocal = async (arquivo: File): Promise<DadosPDFExtraidos> => {
  // Esta função será implementada usando pdf2json ou pdfjs-dist
  return new Promise((resolve, reject) => {
    // Implementação será adicionada
    resolve({
      texto_extraido: '',
      bens_detectados: [],
      estatisticas: {
        total_bens: 0,
        campos_preenchidos: {
          numero_patrimonio: 0,
          nome_bem: 0,
          marca: 0,
          modelo: 0,
          numero_serie: 0,
        },
      },
    });
  });
};
