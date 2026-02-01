import type { BemImportacao } from '@/interface/importacao';
import type { CKANRecord } from '@/api/opendata.api';

// Remove 'R$' and thousand separators, convert comma to dot
function parseBRL(value?: string | null): number | undefined {
  if (!value) return undefined;
  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/R\$/i, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

// Normaliza texto (ex.: trims, normalização básica)
function norm(s?: string | null): string | undefined {
  if (!s) return undefined;
  const t = String(s).trim();
  return t || undefined;
}

// Mapeia um registro CKAN (UEG Patrimônio) para BemImportacao
export function mapRecordToBemImportacao(rec: CKANRecord): BemImportacao | null {
  const numero_patrimonio = norm(rec['tombamento'] || rec['tombamento_atual'] || rec['patrimonio']);
  const descricao = norm(rec['descricao']);
  const especie = norm(rec['especie']);
  const classe = norm(rec['classe']);
  const marca = norm(rec['marca']);
  const estado = norm(rec['conservacao']);
  const local = norm(rec['localizacao']);
  const unidade = norm(rec['unidade_administrativa']);
  const nSerie = norm(rec['n. serie'] || rec['numero_serie'] || rec['n_serie']);
  const valor_aquisicao = parseBRL(rec['valor_aquisicao']);
  const valor_atual = parseBRL(rec['valor_atual']);

  if (!numero_patrimonio && !descricao) return null;

  const nome_bem = especie || descricao || 'Bem Patrimonial';

  // Mapear estado de conservação para nossos valores esperados
  const estadoMap: Record<string, BemImportacao['estado_conservacao']> = {
    novo: 'novo',
    bom: 'bom',
    regular: 'regular',
    ruim: 'ruim',
    pessimo: 'péssimo',
    'péssimo': 'péssimo',
  };
  const estadoKey = (estado || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const estadoConservacao = estadoMap[estadoKey as keyof typeof estadoMap];

  return {
    numero_patrimonio: numero_patrimonio || '',
    nome_bem,
    descricao: descricao,
    marca: marca && /não informada/i.test(marca) ? undefined : marca,
    modelo: undefined,
    numero_serie: nSerie || undefined,
    valor_aquisicao,
    valor_atual,
    data_aquisicao: undefined,
    estado_conservacao: estadoConservacao,
    observacoes: undefined,
    local: {
      nome_local: local || 'SEM LOCAL',
      setor: { nome_setor: unidade || 'UEG' },
    },
    categoria: {
      nome_categoria: classe || especie || 'Sem Categoria',
    },
  };
}

export function mapRecordsToBens(records: CKANRecord[]): BemImportacao[] {
  return records
    .map(mapRecordToBemImportacao)
    .filter((b): b is BemImportacao => Boolean(b));
}
