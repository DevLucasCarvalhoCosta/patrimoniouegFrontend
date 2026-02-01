import type { ColumnsType } from 'antd/es/table/interface';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportHeaderConfig {
  sistema?: string; // e.g., "Sistema de Patrimônio Mobiliário"
  titulo?: string; // e.g., "RELATÓRIO BEM PERMANENTE"
  orgao?: string; // e.g., "UNIVERSIDADE ESTADUAL DE GOIÁS - UEG"
  unidadeAdm?: string; // e.g., "UNIDADE UNIVERSITÁRIA DE TRINDADE"
  situacaoBem?: string; // e.g., "ATIVOS e CEDIDOS"
  exercicio?: string; // e.g., "2025/4"
  dataEmissao?: string; // e.g., format 'DD/MM/YYYY HH:mm:ss'
  logoUrl?: string; // optional logo path (same-origin)
}

export interface ExportPDFOptions<T> {
  filename: string;
  columns: ColumnsType<T>;
  data: T[];
  title?: string;
  subtitle?: string;
  filtersText?: string;
  reportHeader?: ReportHeaderConfig;
}

async function loadImageAsDataURL(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erro ao carregar imagem'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export async function exportToPdf<T extends Record<string, any>>(opts: ExportPDFOptions<T>) {
  const { filename, columns, data, title, subtitle, filtersText, reportHeader } = opts;

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

  const doc = new jsPDF({ orientation: 'landscape' });

  const brandColor = [29, 35, 98];

  let y = 12;

  // Cabeçalho padrão estilo relatório institucional
  if (reportHeader) {
    const {
  sistema = 'Sistema de Patrimonio',
      titulo: headerTitulo,
      orgao,
      unidadeAdm,
      situacaoBem,
      exercicio,
      dataEmissao,
      logoUrl,
    } = reportHeader;

    // Logo (opcional)
    let hasLogo = false;
    if (logoUrl) {
      try {
        const dataUrl = await loadImageAsDataURL(logoUrl);
        if (dataUrl) {
          // Logo no canto antes do nome do sistema
          doc.addImage(dataUrl, 'PNG', 10, y - 5, 28, 12);
          hasLogo = true;
        }
      } catch {
        // ignore logo errors
      }
    }

    // Sistema (cabeçalho superior)
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const leftX = hasLogo ? 44 : 10;
    doc.text(sistema, leftX, y);

    // Data de emissão no canto direito
    const nowText = dataEmissao || new Date().toLocaleString('pt-BR');
    doc.text(`Data de Emissão: ${nowText}`, 287, y, { align: 'right' });
    y += 6;

    // Título do relatório
    const reportTitle = headerTitulo || title || 'Relatório';
    doc.setFontSize(14);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(reportTitle, 148.5, y, { align: 'center' });
    y += 8;

    // Linha com situação, exercício e unidade
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const leftLineParts: string[] = [];
    if (situacaoBem) leftLineParts.push(`Situação do Bem: ${situacaoBem}`);
    if (exercicio) leftLineParts.push(`Por Exercício: ${exercicio}`);
    const leftLine = leftLineParts.join('   ');
    if (leftLine) doc.text(leftLine, 10, y);
    if (unidadeAdm) {
      doc.text(`Unidade Administrativa: ${unidadeAdm}`, 148.5, y, { align: 'center' });
    }
    y += 6;

    if (orgao) {
      doc.text(`Órgão: ${orgao}`, 10, y);
      y += 6;
    }

    // pequena linha separadora
    doc.setDrawColor(200);
    doc.line(10, y, 287, y);
    y += 4;
  }

  // Barra de título clássica (mantida para realce, se title for fornecido)
  if (title) {
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(10, y, 277, 10, 'F');
    doc.text(title, 148.5, y + 7, { align: 'center' });
    y += 14;
  }

  let yStart = y;

  if (subtitle || filtersText) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (subtitle) {
      doc.text(subtitle, 10, yStart);
      yStart += 6;
    }
    if (filtersText) {
      doc.setFontSize(9);
      doc.text(filtersText, 10, yStart);
      yStart += 6;
    }
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yStart,
    styles: { fontSize: 8 },
    headStyles: {
      fillColor: brandColor as any,
      textColor: [255, 255, 255],
    },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: 10, right: 10 },
  });

  doc.save(`${filename}.pdf`);
}
