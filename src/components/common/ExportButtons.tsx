import type { ColumnsType } from 'antd/es/table/interface';
import type { FC } from 'react';

import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import React from 'react';

import { exportToPdf } from '@/utils/export/pdf';
import { exportToXlsx } from '@/utils/export/xlsx';

export interface ExportButtonsProps<T> {
  columns: ColumnsType<T>;
  data: T[];
  filename: string; // base filename
  title?: string;
  subtitle?: string;
  filtersText?: string;
  size?: 'small' | 'middle' | 'large';
  reportHeader?: {
    sistema?: string;
    titulo?: string;
    orgao?: string;
    unidadeAdm?: string;
    situacaoBem?: string;
    exercicio?: string;
    dataEmissao?: string;
    logoUrl?: string;
  };
}

const ExportButtons = <T extends Record<string, any>>({
  columns,
  data,
  filename,
  title,
  subtitle,
  filtersText,
  size = 'middle',
  reportHeader,
}: ExportButtonsProps<T>) => {
  const onPdf = () =>
    exportToPdf({ filename, columns, data, title: title || filename, subtitle, filtersText, reportHeader });

  const onXlsx = () =>
    exportToXlsx({ filename, columns, data, header: title || filename, footerNote: subtitle, headerMeta: reportHeader });

  const items = [
    {
      key: 'pdf',
      icon: <FilePdfOutlined style={{ color: '#cf1322' }} />,
      label: 'Exportar PDF',
      onClick: onPdf,
    },
    {
      key: 'xlsx',
      icon: <FileExcelOutlined style={{ color: '#389e0d' }} />,
      label: 'Exportar Excel',
      onClick: onXlsx,
    },
  ];

  return (
    <Dropdown menu={{ items }}>
      <Button icon={<DownloadOutlined />} size={size}>
        Exportar
      </Button>
    </Dropdown>
  );
};

export default ExportButtons;
