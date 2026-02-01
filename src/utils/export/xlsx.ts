import type { ColumnsType } from 'antd/es/table/interface';

import XLSX from 'xlsx-js-style';

export interface ExportOptions<T> {
  filename: string; // sem extensão
  columns: ColumnsType<T>; // antd Columns
  data: T[]; // linhas já filtradas/visíveis
  header?: string; // título opcional
  footerNote?: string; // nota opcional rodapé
  headerMeta?: {
    sistema?: string;
    titulo?: string;
    orgao?: string;
    unidadeAdm?: string;
    situacaoBem?: string;
    exercicio?: string;
    dataEmissao?: string;
  };
}

// Converte Columns + data para worksheet com estilos básicos no padrão do projeto
export function exportToXlsx<T extends Record<string, any>>(opts: ExportOptions<T>) {
  const { filename, columns, data, header, footerNote, headerMeta } = opts;

  const visibleCols = (columns || []).filter((c: any) => c && c.title && c.dataIndex);
  const headers = visibleCols.map((c: any) => String(c.title));

  const rows = (data || []).map((row: any) =>
    visibleCols.map((c: any) => {
      const idx = c.dataIndex as string | string[];
      let value: any;
      if (Array.isArray(idx)) {
        value = idx.reduce((acc, key) => (acc ? acc[key] : undefined), row);
      } else {
        value = row[idx as string];
      }
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    }),
  );

  const aoa: any[][] = [];

  const brandColor = { rgb: '1D2362' }; // rgb(29, 35, 98)

  // Cabeçalho institucional (metadados)
  if (headerMeta) {
    const sistema = headerMeta.sistema || 'Sistema de Patrimonio';
    const dataEmissao = headerMeta.dataEmissao || new Date().toLocaleString('pt-BR');
    aoa.push([sistema, '', '', '', '', '', `Data de Emissão: ${dataEmissao}`]);
    aoa.push([]);
    const tituloRel = headerMeta.titulo || header || 'Relatório';
    aoa.push([tituloRel]);
    aoa.push([]);
    const linha2: any[] = [];
    if (headerMeta.situacaoBem) linha2.push(`Situação do Bem: ${headerMeta.situacaoBem}`);
    if (headerMeta.exercicio) linha2.push(`Por Exercício: ${headerMeta.exercicio}`);
    aoa.push([linha2.join('   ')]);
    if (headerMeta.unidadeAdm) aoa.push([`Unidade Administrativa: ${headerMeta.unidadeAdm}`]);
    if (headerMeta.orgao) aoa.push([`Órgão: ${headerMeta.orgao}`]);
    aoa.push([]);
  } else if (header) {
    aoa.push([header]);
  }

  aoa.push(headers);
  aoa.push(...rows);

  if (footerNote) {
    aoa.push([]);
    aoa.push([footerNote]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Estilo: header/title com cor da marca
  const getCell = (r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })];

  // Estilizar linhas do cabeçalho institucional
  let metaRowsUsed = 0;
  if (headerMeta) {
    // linha 0: sistema + emissão (e merges)
    const r0 = 0;
    const cellSys = getCell(r0, 0);
    if (cellSys) {
      cellSys.s = { font: { bold: true } } as any;
    }
    // titulo (provavelmente r2)
    const r2 = 2; // considerando linha em branco após sistema
    const cellTitle = getCell(r2, 0);
    if (cellTitle) {
      cellTitle.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center' },
        fill: { fgColor: brandColor },
      } as any;
    }
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: r2, c: 0 }, e: { r: r2, c: Math.max(0, headers.length - 1) } });
    metaRowsUsed = aoa.findIndex(row => row === headers);
    if (metaRowsUsed < 0) metaRowsUsed = 0; // fallback
  }

  let rowOffset = 0;
  if (!headerMeta && header) {
    const c = 0;
    const cell = getCell(0, c);
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center' },
        fill: { fgColor: brandColor },
      } as any;
    }
    // mesclar título pela quantidade de colunas
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, headers.length - 1) } });
    rowOffset = 1;
  } else if (headerMeta) {
    rowOffset = metaRowsUsed + 1; // header row is appended right before rows
  }

  // Header da tabela
  headers.forEach((_, ci) => {
    const cell = getCell(rowOffset, ci);
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: brandColor },
        border: {
          top: { style: 'thin', color: { rgb: 'DDDDDD' } },
          left: { style: 'thin', color: { rgb: 'DDDDDD' } },
          right: { style: 'thin', color: { rgb: 'DDDDDD' } },
          bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
        },
      } as any;
    }
  });

  // Bordas das linhas
  rows.forEach((r, ri) => {
    r.forEach((_, ci) => {
      const cell = getCell(rowOffset + 1 + ri, ci);
      if (cell) {
        cell.s = {
          border: {
            top: { style: 'thin', color: { rgb: 'EEEEEE' } },
            left: { style: 'thin', color: { rgb: 'EEEEEE' } },
            right: { style: 'thin', color: { rgb: 'EEEEEE' } },
            bottom: { style: 'thin', color: { rgb: 'EEEEEE' } },
          },
        } as any;
      }
    });
  });

  // Larguras automáticas básicas
  const colWidths = headers.map((h, i) => {
    const maxContent = Math.max(
      h.length,
      ...rows.map(r => (r[i] ? String(r[i]).length : 0)),
    );
    return { wch: Math.min(60, Math.max(10, maxContent + 2)) } as any;
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
