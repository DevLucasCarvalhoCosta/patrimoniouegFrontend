import type { ImportacaoBemItem } from '@/interface/importacao';

import { message } from 'antd';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  carregarDadosAuxiliares,
  clearImportacaoAtual,
  obterDadosNormalizacao,
  obterImportacao,
  obterItens,
} from '@/stores/importacao.store';

/**
 * Hook para gerenciar dados de uma importação específica
 */
export const useImportacaoDetalhes = (importacaoId?: string) => {
  const dispatch = useDispatch();
  const {
    importacaoAtual,
    itens,
    dadosNormalizacao,
    categorias,
    locais,
    loading,
    loadingItens,
    loadingNormalizacao,
    filtrosItens,
    paginacaoItens,
    error,
  } = useSelector((state: any) => state.importacao);

  // Carregar dados iniciais
  useEffect(() => {
    if (importacaoId) {
      dispatch(obterImportacao(importacaoId) as any);
      dispatch(obterDadosNormalizacao(importacaoId) as any);
      loadItens();
    }

    // Carregar dados auxiliares se não estiverem carregados
    if (categorias.length === 0 || locais.length === 0) {
      dispatch(carregarDadosAuxiliares() as any);
    }

    // Cleanup ao desmontar
    return () => {
      dispatch(clearImportacaoAtual());
    };
  }, [importacaoId, dispatch]);

  // Recarregar itens quando filtros mudarem
  useEffect(() => {
    if (importacaoId) {
      loadItens();
    }
  }, [filtrosItens, paginacaoItens.current, paginacaoItens.pageSize]);

  const loadItens = useCallback(() => {
    if (!importacaoId) return;

    const filtros = {
      status: filtrosItens.status.length > 0 ? filtrosItens.status : undefined,
      busca: filtrosItens.busca || undefined,
      localMapeado: filtrosItens.localMapeado,
      categoriaMapeada: filtrosItens.categoriaMapeada,
      page: paginacaoItens.current,
      limit: paginacaoItens.pageSize,
    };

    dispatch(obterItens({ importacaoId, filtros }) as any);
  }, [importacaoId, filtrosItens, paginacaoItens, dispatch]);

  const recarregarDados = useCallback(() => {
    if (!importacaoId) return;

    dispatch(obterImportacao(importacaoId) as any);
    dispatch(obterDadosNormalizacao(importacaoId) as any);
    loadItens();
  }, [importacaoId, loadItens, dispatch]);

  const recarregarItens = useCallback(() => {
    loadItens();
  }, [loadItens]);

  // Verificar se pode confirmar a importação
  const podeConfirmar = importacaoAtual?.status === 'PARSED' && dadosNormalizacao?.pode_confirmar;

  // Estatísticas dos itens
  const estatisticasItens = {
    total: itens.length,
    prontos: itens.filter((item: ImportacaoBemItem) => item.status === 'READY').length,
    duplicados: itens.filter((item: ImportacaoBemItem) => item.status === 'DUPLICATE').length,
    erros: itens.filter((item: ImportacaoBemItem) => item.status === 'ERROR').length,
    pendentes: itens.filter((item: ImportacaoBemItem) => item.status === 'PENDING').length,
    criados: itens.filter((item: ImportacaoBemItem) => item.status === 'CREATED').length,
  };

  return {
    // Dados
    importacao: importacaoAtual,
    itens,
    dadosNormalizacao,
    categorias,
    locais,
    estatisticasItens,

    // Estados
    loading,
    loadingItens,
    loadingNormalizacao,
    error,
    podeConfirmar,

    // Funções
    recarregarDados,
    recarregarItens,
  };
};

/**
 * Hook para polling de status de importação
 */
export const useImportacaoPolling = (importacaoId?: string, interval = 3000) => {
  const dispatch = useDispatch();
  const { importacaoAtual } = useSelector((state: any) => state.importacao);

  useEffect(() => {
    if (!importacaoId || !importacaoAtual) return;

    // Fazer polling apenas para importações em processamento
    if (importacaoAtual.status === 'PARSED') {
      const timer = setInterval(() => {
        dispatch(obterImportacao(importacaoId) as any);
      }, interval);

      return () => clearInterval(timer);
    }
  }, [importacaoId, importacaoAtual?.status, interval, dispatch]);
};

/**
 * Hook para gerenciar notificações de importação
 */
export const useImportacaoNotifications = () => {
  const { error } = useSelector((state: any) => state.importacao);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);
};
