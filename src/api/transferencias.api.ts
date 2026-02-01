import type { EstatisticasTransferencias, ExecutarTransferenciaParams, Transferencia } from '@/interface/entities';

import { apiProtected } from '@/config/api';

import { request } from './request';

// === ENDPOINTS PRINCIPAIS ===

/** Executar transferência (somente admin) */
export const apiExecutarTransferencia = (data: ExecutarTransferenciaParams) =>
  request<{ id_transferencia: number }>('post', apiProtected('/transferencias/executar'), data);

/** Lista geral de transferências */
export const apiListTransferencias = (params?: {
  page?: number;
  limit?: number;
  cod_local_origem?: number;
  cod_local_destino?: number;
  id_usuario_responsavel?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}) =>
  request<{ transferencias: Transferencia[]; total: number }>('get', apiProtected('/transferencias'), undefined, {
    params,
  });

/** Obter transferência por ID */
export const apiGetTransferencia = (id: number) => request<Transferencia>('get', apiProtected(`/transferencias/${id}`));

// === ENDPOINTS POR CONTEXTO ===

/** Transferências de um bem específico */
export const apiGetTransferenciasBem = (cod_bem: number) =>
  request<Transferencia[]>('get', apiProtected(`/bens/${cod_bem}/transferencias`));

/** Transferências de um local específico */
export const apiGetTransferenciasLocal = (cod_local: number, tipo: 'origem' | 'destino' | 'ambos' = 'ambos') =>
  request<Transferencia[]>('get', apiProtected(`/locais/${cod_local}/transferencias`), undefined, { params: { tipo } });

/** Transferências de um setor específico */
export const apiGetTransferenciasSetor = (cod_setor: number, tipo: 'origem' | 'destino' | 'ambos' = 'ambos') =>
  request<Transferencia[]>('get', apiProtected(`/setores/${cod_setor}/transferencias`), undefined, {
    params: { tipo },
  });

/** Transferências de um usuário específico */
export const apiGetTransferenciasUsuario = (id_usuario: number) =>
  request<Transferencia[]>('get', apiProtected(`/usuarios/${id_usuario}/transferencias`));

// === ENDPOINTS DE ESTATÍSTICAS E DASHBOARD (admin) ===

/** Estatísticas gerais (admin) */
export const apiGetEstatisticasGerais = () =>
  request<EstatisticasTransferencias>('get', apiProtected('/transferencias/estatisticas/geral'));

/** Estatísticas por período (admin) */
export const apiGetEstatisticasPeriodo = (dataInicio: string, dataFim: string) =>
  request<EstatisticasTransferencias>('get', apiProtected('/transferencias/estatisticas/periodo'), undefined, {
    params: { dataInicio, dataFim },
  });

/** Transferências recentes para dashboard */
export const apiGetTransferenciasRecentes = (limite = 10) =>
  request<Transferencia[]>('get', apiProtected('/transferencias/dashboard/recentes'), undefined, {
    params: { limite },
  });
