import type { Categoria, Local } from '@/interface/entities';
import type {
  DadosNormalizacao,
  EstatisticasImportacao,
  FiltrosItens,
  ImportacaoBem,
  ImportacaoBemItem,
  ImportacaoFilters,
  MapeamentoCategoria,
  MapeamentoLocal,
} from '@/interface/importacao';
import type { PayloadAction } from '@reduxjs/toolkit';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { apiListCategoriasProtected } from '@/api/categorias.api';
import {
  apiAplicarMapeamentoCategoria,
  apiAplicarMapeamentoLocal,
  apiCancelarImportacao,
  apiConfirmarImportacao,
  apiExcluirImportacao,
  apiGetDadosNormalizacao,
  apiGetEstatisticasImportacao,
  apiGetImportacao,
  apiGetItensImportacao,
  apiListImportacoes,
  apiReprocessarNormalizacao,
  apiUploadPDFImportacao,
} from '@/api/importacao.api';
import { apiListLocaisProtected } from '@/api/locais.api';

interface ImportacaoState {
  // Dados principais
  importacoes: ImportacaoBem[];
  importacaoAtual: ImportacaoBem | null;
  itens: ImportacaoBemItem[];
  estatisticas: EstatisticasImportacao | null;
  dadosNormalizacao: DadosNormalizacao | null;

  // Dados auxiliares
  categorias: Categoria[];
  locais: Local[];

  // Estados de loading
  loading: boolean;
  uploading: boolean;
  loadingItens: boolean;
  loadingNormalizacao: boolean;
  loadingConfirmacao: boolean;

  // Estados de UI
  modalUploadOpen: boolean;
  modalConfirmacaoOpen: boolean;
  abaAtiva: 'geral' | 'itens' | 'normalizacao';

  // Filtros e paginação
  filtros: ImportacaoFilters;
  filtrosItens: FiltrosItens;
  paginacao: {
    current: number;
    pageSize: number;
    total: number;
  };
  paginacaoItens: {
    current: number;
    pageSize: number;
    total: number;
  };

  // Erro
  error: string | null;
}

const initialState: ImportacaoState = {
  importacoes: [],
  importacaoAtual: null,
  itens: [],
  estatisticas: null,
  dadosNormalizacao: null,
  categorias: [],
  locais: [],
  loading: false,
  uploading: false,
  loadingItens: false,
  loadingNormalizacao: false,
  loadingConfirmacao: false,
  modalUploadOpen: false,
  modalConfirmacaoOpen: false,
  abaAtiva: 'geral',
  filtros: {},
  filtrosItens: {
    status: [],
    busca: '',
    localMapeado: null,
    categoriaMapeada: null,
    comErro: null,
  },
  paginacao: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  paginacaoItens: {
    current: 1,
    pageSize: 20,
    total: 0,
  },
  error: null,
};

// === ASYNC THUNKS ===

export const uploadPDF = createAsyncThunk('importacao/uploadPDF', async (arquivo: File) => {
  const response = await apiUploadPDFImportacao(arquivo);

  return response.result;
});

export const listarImportacoes = createAsyncThunk(
  'importacao/listarImportacoes',
  async (filters?: ImportacaoFilters) => {
    const response = await apiListImportacoes(filters);

    return response.result;
  },
);

export const obterImportacao = createAsyncThunk('importacao/obterImportacao', async (id: string) => {
  const response = await apiGetImportacao(id);

  return response.result;
});

export const obterItens = createAsyncThunk(
  'importacao/obterItens',
  async ({ importacaoId, filtros }: { importacaoId: string; filtros?: any }) => {
    const response = await apiGetItensImportacao(importacaoId, filtros);

    return response.result;
  },
);

export const obterEstatisticas = createAsyncThunk('importacao/obterEstatisticas', async () => {
  const response = await apiGetEstatisticasImportacao();

  return response.result;
});

export const carregarDadosAuxiliares = createAsyncThunk('importacao/carregarDadosAuxiliares', async () => {
  const [categoriasRes, locaisRes] = await Promise.all([apiListCategoriasProtected(), apiListLocaisProtected()]);

  return {
    categorias: categoriasRes.result || [],
    locais: locaisRes.result || [],
  };
});

export const reprocessarNormalizacao = createAsyncThunk(
  'importacao/reprocessarNormalizacao',
  async (importacaoId: string) => {
    const response = await apiReprocessarNormalizacao(importacaoId);

    return response.result;
  },
);

export const obterDadosNormalizacao = createAsyncThunk(
  'importacao/obterDadosNormalizacao',
  async (importacaoId: string) => {
    const response = await apiGetDadosNormalizacao(importacaoId);

    return response.result;
  },
);

export const aplicarMapeamentoLocal = createAsyncThunk(
  'importacao/aplicarMapeamentoLocal',
  async ({
    importacaoId,
    mapeamento,
  }: {
    importacaoId: string;
    mapeamento: { local_original: string; cod_local: number };
  }) => {
    await apiAplicarMapeamentoLocal(importacaoId, mapeamento);

    return mapeamento;
  },
);

export const aplicarMapeamentoCategoria = createAsyncThunk(
  'importacao/aplicarMapeamentoCategoria',
  async ({
    importacaoId,
    mapeamento,
  }: {
    importacaoId: string;
    mapeamento: { classe_original: string; cod_categoria: number };
  }) => {
    await apiAplicarMapeamentoCategoria(importacaoId, mapeamento);

    return mapeamento;
  },
);

export const confirmarImportacao = createAsyncThunk('importacao/confirmarImportacao', async (importacaoId: string) => {
  const response = await apiConfirmarImportacao(importacaoId);

  return response.result;
});

export const cancelarImportacao = createAsyncThunk(
  'importacao/cancelarImportacao',
  async ({ importacaoId, motivo }: { importacaoId: string; motivo?: string }) => {
    await apiCancelarImportacao(importacaoId, motivo);

    return importacaoId;
  },
);

export const excluirImportacao = createAsyncThunk('importacao/excluirImportacao', async (importacaoId: string) => {
  await apiExcluirImportacao(importacaoId);

  return importacaoId;
});

// === SLICE ===

const importacaoSlice = createSlice({
  name: 'importacao',
  initialState,
  reducers: {
    setModalUploadOpen: (state, action: PayloadAction<boolean>) => {
      state.modalUploadOpen = action.payload;
    },
    setModalConfirmacaoOpen: (state, action: PayloadAction<boolean>) => {
      state.modalConfirmacaoOpen = action.payload;
    },
    setAbaAtiva: (state, action: PayloadAction<'geral' | 'itens' | 'normalizacao'>) => {
      state.abaAtiva = action.payload;
    },
    setFiltros: (state, action: PayloadAction<Partial<ImportacaoFilters>>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },
    setFiltrosItens: (state, action: PayloadAction<Partial<FiltrosItens>>) => {
      state.filtrosItens = { ...state.filtrosItens, ...action.payload };
    },
    setPaginacao: (state, action: PayloadAction<Partial<typeof initialState.paginacao>>) => {
      state.paginacao = { ...state.paginacao, ...action.payload };
    },
    setPaginacaoItens: (state, action: PayloadAction<Partial<typeof initialState.paginacaoItens>>) => {
      state.paginacaoItens = { ...state.paginacaoItens, ...action.payload };
    },
    clearError: state => {
      state.error = null;
    },
    clearImportacaoAtual: state => {
      state.importacaoAtual = null;
      state.itens = [];
      state.dadosNormalizacao = null;
      state.abaAtiva = 'geral';
    },
  },
  extraReducers: builder => {
    // Upload PDF
    builder
      .addCase(uploadPDF.pending, state => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadPDF.fulfilled, (state, action) => {
        state.uploading = false;
        state.modalUploadOpen = false;

        // Adicionar nova importação à lista
        if (action.payload.importacao_id) {
          // A importação será carregada separadamente na página de detalhes
        }
      })
      .addCase(uploadPDF.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message || 'Erro no upload';
      });

    // Listar importações
    builder
      .addCase(listarImportacoes.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listarImportacoes.fulfilled, (state, action) => {
        state.loading = false;
        state.importacoes = action.payload.importacoes || [];
        state.paginacao.total = action.payload.total || 0;
      })
      .addCase(listarImportacoes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar importações';
      });

    // Obter importação específica
    builder
      .addCase(obterImportacao.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(obterImportacao.fulfilled, (state, action) => {
        state.loading = false;
        state.importacaoAtual = action.payload;
      })
      .addCase(obterImportacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Erro ao carregar importação';
      });

    // Obter itens
    builder
      .addCase(obterItens.pending, state => {
        state.loadingItens = true;
        state.error = null;
      })
      .addCase(obterItens.fulfilled, (state, action) => {
        state.loadingItens = false;
        state.itens = action.payload.itens || [];
        state.paginacaoItens.total = action.payload.total || 0;
      })
      .addCase(obterItens.rejected, (state, action) => {
        state.loadingItens = false;
        state.error = action.error.message || 'Erro ao carregar itens';
      });

    // Estatísticas
    builder.addCase(obterEstatisticas.fulfilled, (state, action) => {
      state.estatisticas = action.payload;
    });

    // Dados auxiliares
    builder.addCase(carregarDadosAuxiliares.fulfilled, (state, action) => {
      state.categorias = action.payload.categorias;
      state.locais = action.payload.locais;
    });

    // Normalização
    builder
      .addCase(reprocessarNormalizacao.pending, state => {
        state.loadingNormalizacao = true;
        state.error = null;
      })
      .addCase(reprocessarNormalizacao.fulfilled, (state, action) => {
        state.loadingNormalizacao = false;
        state.dadosNormalizacao = action.payload;
      })
      .addCase(reprocessarNormalizacao.rejected, (state, action) => {
        state.loadingNormalizacao = false;
        state.error = action.error.message || 'Erro ao reprocessar normalização';
      });

    builder.addCase(obterDadosNormalizacao.fulfilled, (state, action) => {
      state.dadosNormalizacao = action.payload;
    });

    // Mapeamentos
    builder.addCase(aplicarMapeamentoLocal.fulfilled, (state, action) => {
      // Atualizar dados de normalização
      if (state.dadosNormalizacao) {
        const mapeamento = state.dadosNormalizacao.mapeamentos_locais.find(
          m => m.local_original === action.payload.local_original,
        );

        if (mapeamento) {
          mapeamento.cod_local = action.payload.cod_local;
        }
      }
    });

    builder.addCase(aplicarMapeamentoCategoria.fulfilled, (state, action) => {
      // Atualizar dados de normalização
      if (state.dadosNormalizacao) {
        const mapeamento = state.dadosNormalizacao.mapeamentos_categorias.find(
          m => m.classe_original === action.payload.classe_original,
        );

        if (mapeamento) {
          mapeamento.cod_categoria = action.payload.cod_categoria;
        }
      }
    });

    // Confirmação
    builder
      .addCase(confirmarImportacao.pending, state => {
        state.loadingConfirmacao = true;
        state.error = null;
      })
      .addCase(confirmarImportacao.fulfilled, (state, action) => {
        state.loadingConfirmacao = false;
        state.modalConfirmacaoOpen = false;

        // Atualizar status da importação atual
        if (state.importacaoAtual) {
          state.importacaoAtual.status = 'CONFIRMED';
          state.importacaoAtual.criadas = action.payload.bens_criados;
          state.importacaoAtual.ignoradas = action.payload.bens_ignorados;
        }
      })
      .addCase(confirmarImportacao.rejected, (state, action) => {
        state.loadingConfirmacao = false;
        state.error = action.error.message || 'Erro ao confirmar importação';
      });

    // Cancelar importação
    builder.addCase(cancelarImportacao.fulfilled, (state, action) => {
      // Atualizar status na lista
      const importacao = state.importacoes.find(i => i.id === action.payload);

      if (importacao) {
        importacao.status = 'CANCELLED';
      }

      // Atualizar importação atual se for a mesma
      if (state.importacaoAtual?.id === action.payload) {
        state.importacaoAtual.status = 'CANCELLED';
      }
    });

    // Excluir importação
    builder.addCase(excluirImportacao.fulfilled, (state, action) => {
      // Remover da lista
      state.importacoes = state.importacoes.filter(i => i.id !== action.payload);

      // Limpar importação atual se for a mesma
      if (state.importacaoAtual?.id === action.payload) {
        state.importacaoAtual = null;
        state.itens = [];
        state.dadosNormalizacao = null;
      }
    });
  },
});

export const {
  setModalUploadOpen,
  setModalConfirmacaoOpen,
  setAbaAtiva,
  setFiltros,
  setFiltrosItens,
  setPaginacao,
  setPaginacaoItens,
  clearError,
  clearImportacaoAtual,
} = importacaoSlice.actions;

export default importacaoSlice.reducer;
