// CKAN (Dados Abertos GO)

import { request } from './request';
import { CKAN_BASE } from '@/config/api';

export type CKANRecord = Record<string, any>;

export interface CKANDatastoreSearchResult {
  resource_id: string;
  fields: Array<{ id: string; type: string }>;
  records: CKANRecord[];
  total: number;
  _links?: { start?: string; next?: string; prev?: string };
}

export interface CKANResponse<T = any> {
  help?: string;
  success: boolean;
  result: T;
  error?: { message?: string; __type?: string };
}

export interface CKANQueryParams {
  resource_id: string;
  q?: string;
  filters?: Record<string, string | number | boolean>;
  limit?: number;
  offset?: number;
  fields?: string[];
  sort?: string;
}

export const apiFetchOpenDataRecords = (params: CKANQueryParams) => {
  const { filters, fields, ...rest } = params;

  // Monta a URL correta para o proxy CKAN
  const ckanUrl = `${CKAN_BASE}/api/3/action/datastore_search`;
  
  console.log('Requisição CKAN:', {
    url: ckanUrl,
    params: {
      ...rest,
      filters: filters ? JSON.stringify(filters) : undefined,
    },
  });

  return request<CKANResponse<CKANDatastoreSearchResult>>(
    'get',
    ckanUrl,
    undefined,
    {
      params: {
        ...rest,
        ...(filters ? { filters: JSON.stringify(filters) } : {}),
        ...(fields && fields.length ? { fields: fields.join(',') } : {}),
      },
    },
  );
};
