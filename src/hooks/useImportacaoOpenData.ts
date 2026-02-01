import type { BemImportacao, ResultadoValidacao } from '@/interface/importacao';

import { message } from 'antd';
import { useCallback, useState } from 'react';

import { apiExecutarImportacaoLote, apiValidarImportacaoLote } from '@/api/importacao.api';
import { apiFetchOpenDataRecords } from '@/api/opendata.api';
import { mapRecordsToBens } from '@/utils/opendata-mapper';

export interface OpenDataParams {
  resource_id: string;
  unidade_administrativa: string;
  limit?: number;
  offset?: number;
}

export const useImportacaoOpenData = () => {
  const [loading, setLoading] = useState(false);
  const [bens, setBens] = useState<BemImportacao[]>([]);
  const [validacao, setValidacao] = useState<ResultadoValidacao | null>(null);

  const fetchBens = useCallback(async (params: OpenDataParams) => {
    try {
      setLoading(true);
      setValidacao(null);
      const response = await apiFetchOpenDataRecords({
        resource_id: params.resource_id,
        filters: { unidade_administrativa: params.unidade_administrativa },
        limit: params.limit ?? 2000,
        offset: params.offset ?? 0,
      });

      console.log('CKAN Response completa:', response);

      // A resposta da função request() já normaliza para { status, message, result }
      // O result contém a resposta CKAN: { success: true, result: { records: [...] } }
      
      if (!response || !response.status) {
        console.error('Resposta da API inválida:', response);
        throw new Error('Erro na comunicação com a API');
      }

      const ckanData = response.result;
      console.log('CKAN Data:', ckanData);

      // Verificar se é uma resposta CKAN válida
      if (!ckanData || typeof ckanData !== 'object') {
        console.error('Dados CKAN inválidos:', ckanData);
        throw new Error('Resposta do portal de dados abertos está em formato inválido');
      }

      // Verificar se a resposta CKAN teve sucesso
      if (ckanData.success === false) {
        const errorMsg = ckanData.error?.message || 'resposta sem sucesso';
        console.error('Erro CKAN:', ckanData.error);
        throw new Error('Erro na consulta aos dados abertos: ' + errorMsg);
      }

      // Verificar se há records
      const datastoreResult = ckanData.result;
      if (!datastoreResult || !Array.isArray(datastoreResult.records)) {
        console.error('Records não encontrados:', datastoreResult);
        throw new Error('Nenhum dado encontrado na consulta aos dados abertos');
      }
      
      const records = datastoreResult.records;
      console.log('Records encontrados:', records.length);
      
      if (records.length === 0) {
        message.warning('Nenhum bem encontrado para esta unidade administrativa');
        setBens([]);
        return;
      }
      
      const mapped = mapRecordsToBens(records);
      setBens(mapped);

      message.success(`${mapped.length} bens carregados do Dados Abertos`);
    } catch (err: any) {
      console.error('Erro completo:', err);
      const errorMessage = err?.message || 'Erro ao buscar dados abertos';
      message.error(errorMessage);
      setBens([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validar = useCallback(async () => {
    try {
      setLoading(true);
      const parseNum = (v: any): number | undefined => {
        if (v === null || v === undefined || v === '') return undefined;
        if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
        const s = String(v).replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };
      const bensNorm = bens.map(b => ({
        ...b,
        valor_aquisicao: parseNum((b as any).valor_aquisicao),
        valor_atual: parseNum((b as any).valor_atual),
      }));
      const resp = await apiValidarImportacaoLote({ bens: bensNorm, validacao_duplicatas: true });
      setValidacao(resp.result);
      if (resp.result.validacao.invalidos > 0 || resp.result.validacao.duplicatas > 0) {
        message.warning('Há problemas/duplicatas a resolver antes da importação.');
      } else {
        message.success('Dados válidos para importação.');
      }
      return resp.result;
    } finally {
      setLoading(false);
    }
  }, [bens]);

  const importar = useCallback(async () => {
    try {
      setLoading(true);
      const parseNum = (v: any): number | undefined => {
        if (v === null || v === undefined || v === '') return undefined;
        if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
        const s = String(v).replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };
      const bensNorm = bens.map(b => ({
        ...b,
        valor_aquisicao: parseNum((b as any).valor_aquisicao),
        valor_atual: parseNum((b as any).valor_atual),
      }));
      const resp = await apiExecutarImportacaoLote({
        bens: bensNorm,
        validacao_duplicatas: true,
        auto_criar_relacionamentos: true,
      });
      message.success('Importação executada.');
      return resp.result;
    } finally {
      setLoading(false);
    }
  }, [bens]);

  const editarBem = useCallback((index: number, campo: string, valor: any) => {
    const novos = [...bens];
    const target: any = novos[index];

    if (campo.includes('.')) {
      const partes = campo.split('.');
      let ref = target as any;
      for (let i = 0; i < partes.length - 1; i++) {
        ref[partes[i]] = ref[partes[i]] || {};
        ref = ref[partes[i]];
      }
      ref[partes[partes.length - 1]] = valor;
    } else {
      target[campo] = valor;
    }

    setBens(novos);
    if (validacao) setValidacao(null);
  }, [bens, validacao]);

  const removerBem = useCallback((index: number) => {
    const novos = bens.filter((_, i) => i !== index);
    setBens(novos);
    if (validacao) setValidacao(null);
  }, [bens, validacao]);

  return { loading, bens, validacao, fetchBens, validar, importar, editarBem, removerBem, setBens, setValidacao };
};
