import type { BemImportacao, DadosPDFExtraidos, ResultadoValidacao } from '@/interface/importacao';

import { message } from 'antd';
import { useState } from 'react';

import { apiExecutarImportacaoLote, apiValidarImportacaoLote } from '@/api/importacao.api';
import { PDFProcessor } from '@/utils/pdf-processor';

export type EtapaImportacao = 'upload' | 'processando' | 'revisao' | 'validando' | 'importando' | 'concluido';

export interface UseImportacaoLoteReturn {
  // Estado
  etapaAtual: EtapaImportacao;
  arquivo: File | null;
  dadosExtraidos: DadosPDFExtraidos | null;
  bensEditaveis: BemImportacao[];
  validacao: ResultadoValidacao | null;
  loading: boolean;
  progress: number;
  
  // Ações
  processarArquivo: (file: File) => Promise<void>;
  validarDados: () => Promise<void>;
  executarImportacao: () => Promise<any>;
  editarBem: (index: number, campo: string, valor: any) => void;
  removerBem: (index: number) => void;
  resetarEstado: () => void;
  voltarEtapa: () => void;
}

export const useImportacaoLote = (): UseImportacaoLoteReturn => {
  const [etapaAtual, setEtapaAtual] = useState<EtapaImportacao>('upload');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosPDFExtraidos | null>(null);
  const [bensEditaveis, setBensEditaveis] = useState<BemImportacao[]>([]);
  const [validacao, setValidacao] = useState<ResultadoValidacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const resetarEstado = () => {
    setEtapaAtual('upload');
    setArquivo(null);
    setDadosExtraidos(null);
    setBensEditaveis([]);
    setValidacao(null);
    setLoading(false);
    setProgress(0);
  };

  const processarArquivo = async (file: File): Promise<void> => {
    try {
      setLoading(true);
      setEtapaAtual('processando');
      setArquivo(file);
      setProgress(25);

      // Carregar PDF.js se não estiver carregado
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        
        await new Promise<void>((resolve) => {
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          };
          document.head.appendChild(script);
        });
      }

      setProgress(50);

      // Processar PDF usando o processador específico para UEG
      const dados = await PDFProcessor.processarPDF(file);
      setDadosExtraidos(dados);
      
      setProgress(75);

      // Validar dados extraídos localmente
      const { validos, invalidos } = PDFProcessor.validarDadosExtraidos(dados.bens_detectados);
      
      if (invalidos.length > 0) {
        console.warn('Bens com problemas detectados:', invalidos);
        message.warning(`${invalidos.length} bens com problemas detectados. Verifique os dados na tabela.`);
      }
      
      setBensEditaveis([...validos, ...invalidos.map(i => i.bem as BemImportacao)]);
      
      setProgress(100);
      setEtapaAtual('revisao');
      
      if (dados.bens_detectados.length === 0) {
        message.warning('Nenhum bem foi detectado no PDF. Verifique se o formato do relatório está correto.');
      } else {
        message.success(
          `PDF processado! ${validos.length} bens válidos encontrados` +
          (invalidos.length > 0 ? ` (${invalidos.length} precisam de revisão)` : '.')
        );
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      message.error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setEtapaAtual('upload');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const validarDados = async (): Promise<void> => {
    try {
      setLoading(true);
      setEtapaAtual('validando');
      
      // Normalizar campos numéricos (valor_atual/valor_aquisicao) antes de enviar
      const parseNum = (v: any): number | undefined => {
        if (v === null || v === undefined || v === '') return undefined;
        if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
        const s = String(v).replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };
      const bensNormalizados = bensEditaveis.map(b => ({
        ...b,
        valor_aquisicao: parseNum((b as any).valor_aquisicao),
        valor_atual: parseNum((b as any).valor_atual),
      }));

      const response = await apiValidarImportacaoLote({
        bens: bensNormalizados,
        validacao_duplicatas: true,
      });
      
      const resultado = response.result;
      setValidacao(resultado);
      setEtapaAtual('revisao');
      
      if (resultado.validacao.invalidos > 0) {
        message.warning(`${resultado.validacao.invalidos} itens com problemas encontrados.`);
      } else if (resultado.validacao.duplicatas > 0) {
        message.warning(`${resultado.validacao.duplicatas} duplicatas encontradas.`);
      } else {
        message.success('Validação concluída com sucesso!');
      }
    } catch (error: any) {
      message.error(error.message || 'Erro ao validar dados');
      setEtapaAtual('revisao');
    } finally {
      setLoading(false);
    }
  };

  const executarImportacao = async (): Promise<any> => {
    try {
      setLoading(true);
      setEtapaAtual('importando');
      
      // Normalizar campos numéricos (valor_atual/valor_aquisicao) antes de enviar
      const parseNum = (v: any): number | undefined => {
        if (v === null || v === undefined || v === '') return undefined;
        if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
        const s = String(v).replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };
      const bensNormalizados = bensEditaveis.map(b => ({
        ...b,
        valor_aquisicao: parseNum((b as any).valor_aquisicao),
        valor_atual: parseNum((b as any).valor_atual),
      }));

      const response = await apiExecutarImportacaoLote({
        bens: bensNormalizados,
        validacao_duplicatas: true,
        auto_criar_relacionamentos: true,
      });
      
      const resultado = response.result;
      setEtapaAtual('concluido');
      
      message.success(
        `Importação concluída! ${resultado.resultado.criados} bens criados, ` +
        `${resultado.resultado.setores_criados} setores, ` +
        `${resultado.resultado.locais_criados} locais e ` +
        `${resultado.resultado.categorias_criadas} categorias criadas.`
      );
      
      return resultado;
    } catch (error: any) {
      message.error(error.message || 'Erro ao executar importação');
      setEtapaAtual('revisao');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const editarBem = (index: number, campo: string, valor: any) => {
    const novosBens = [...bensEditaveis];
    
    if (campo.includes('.')) {
      const partes = campo.split('.');
      let objeto = novosBens[index] as any;
      
      // Navegar até o objeto pai
      for (let i = 0; i < partes.length - 1; i++) {
        if (!objeto[partes[i]]) {
          objeto[partes[i]] = {};
        }
        objeto = objeto[partes[i]];
      }
      
      // Definir valor final
      objeto[partes[partes.length - 1]] = valor;
    } else {
      (novosBens[index] as any)[campo] = valor;
    }
    
    setBensEditaveis(novosBens);
    
    // Limpar validação para revalidar
    if (validacao) {
      setValidacao(null);
    }
  };

  const removerBem = (index: number) => {
    const novosBens = bensEditaveis.filter((_, i) => i !== index);
    setBensEditaveis(novosBens);
    
    // Limpar validação
    if (validacao) {
      setValidacao(null);
    }
  };

  const voltarEtapa = () => {
    if (etapaAtual === 'revisao') {
      setEtapaAtual('upload');
      setValidacao(null);
    }
  };

  return {
    // Estado
    etapaAtual,
    arquivo,
    dadosExtraidos,
    bensEditaveis,
    validacao,
    loading,
    progress,
    
    // Ações
    processarArquivo,
    validarDados,
    executarImportacao,
    editarBem,
    removerBem,
    resetarEstado,
    voltarEtapa,
  };
};
