import type { ImportacaoBem } from '@/interface/importacao';
import type { FC } from 'react';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Progress, Space, Table, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useSelector } from 'react-redux';

import StatusBadge from './StatusBadge';

interface ImportacoesTableProps {
  importacoes: ImportacaoBem[];
  loading?: boolean;
  onView: (importacao: ImportacaoBem) => void;
  onConfirmar: (importacao: ImportacaoBem) => void;
  onCancelar: (importacao: ImportacaoBem) => void;
  onExcluir: (importacao: ImportacaoBem) => void;
  onReprocessar?: (importacao: ImportacaoBem) => void;
  pagination?: any;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
}

const { Text } = Typography;

const ImportacoesTable: FC<ImportacoesTableProps> = ({
  importacoes,
  loading = false,
  onView,
  onConfirmar,
  onCancelar,
  onExcluir,
  onReprocessar,
  pagination,
  onChange,
}) => {
  const { userProfile } = useSelector((state: any) => state.user);
  const isAdmin = userProfile?.perfil === 'admin';

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getProgressPercent = (importacao: ImportacaoBem): number => {
    if (importacao.total_linhas === 0) return 0;
    const processados = importacao.criadas + importacao.ignoradas + importacao.com_erro;

    return Math.round((processados / importacao.total_linhas) * 100);
  };

  const getProgressStatus = (importacao: ImportacaoBem): 'success' | 'exception' | 'normal' => {
    if (importacao.status === 'CONFIRMED') return 'success';
    if (importacao.status === 'FAILED' || importacao.status === 'CANCELLED') return 'exception';

    return 'normal';
  };

  const columns = [
    {
      title: 'Arquivo',
      dataIndex: 'arquivo_nome',
      key: 'arquivo_nome',
      width: 250,
      render: (nome: string, record: ImportacaoBem) => (
        <div className="flex items-center space-x-2">
          <FileTextOutlined className="text-red-500" />
          <div>
            <div className="font-medium text-sm">{nome}</div>
            {record.arquivo_tamanho && (
              <Text type="secondary" className="text-xs">
                {formatFileSize(record.arquivo_tamanho)}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status as any} />,
      filters: [
        { text: 'Processado', value: 'PARSED' },
        { text: 'Confirmado', value: 'CONFIRMED' },
        { text: 'Cancelado', value: 'CANCELLED' },
        { text: 'Falhou', value: 'FAILED' },
      ],
    },
    {
      title: 'Data Upload',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => (
        <div>
          <div className="text-sm">{dayjs(date).format('DD/MM/YYYY')}</div>
          <Text type="secondary" className="text-xs">
            {dayjs(date).format('HH:mm')}
          </Text>
        </div>
      ),
      sorter: (a: ImportacaoBem, b: ImportacaoBem) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Usuário',
      dataIndex: ['usuario', 'nome'],
      key: 'usuario',
      width: 150,
      render: (nome: string, record: ImportacaoBem) => (
        <div>
          <div className="font-medium text-sm">{nome}</div>
          <Text type="secondary" className="text-xs">
            {record.usuario.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Progresso',
      key: 'progresso',
      width: 180,
      render: (record: ImportacaoBem) => {
        const percent = getProgressPercent(record);
        const status = getProgressStatus(record);

        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={status}
              format={() => `${record.criadas + record.ignoradas + record.com_erro}/${record.total_linhas}`}
            />
            <div className="flex justify-between text-xs mt-1">
              <Text type="success">✓ {record.criadas}</Text>
              <Text type="secondary">⏸ {record.ignoradas}</Text>
              <Text type="danger">✗ {record.com_erro}</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 180,
      render: (record: ImportacaoBem) => (
        <Space size="small">
          <Tooltip title="Visualizar detalhes">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record)} size="small" />
          </Tooltip>

          {record.status === 'PARSED' && isAdmin && (
            <>
              <Tooltip title="Confirmar importação">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => onConfirmar(record)}
                  className="text-green-600 hover:text-green-800"
                  size="small"
                />
              </Tooltip>

              {onReprocessar && (
                <Tooltip title="Reprocessar">
                  <Button type="text" icon={<ReloadOutlined />} onClick={() => onReprocessar(record)} size="small" />
                </Tooltip>
              )}
            </>
          )}

          {record.status === 'PARSED' && isAdmin && (
            <Popconfirm
              title="Cancelar importação? Esta ação não pode ser desfeita."
              onConfirm={() => onCancelar(record)}
              okText="Sim"
              cancelText="Não"
            >
              <Tooltip title="Cancelar importação">
                <Button type="text" icon={<CloseCircleOutlined />} danger size="small" />
              </Tooltip>
            </Popconfirm>
          )}

          {(record.status === 'CANCELLED' || record.status === 'FAILED') && isAdmin && (
            <Popconfirm
              title="Excluir importação? Esta ação não pode ser desfeita."
              onConfirm={() => onExcluir(record)}
              okText="Sim"
              cancelText="Não"
            >
              <Tooltip title="Excluir">
                <Button type="text" icon={<DeleteOutlined />} danger size="small" />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<ImportacaoBem>
      columns={columns}
      dataSource={importacoes}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: 1000 }}
      size="small"
      className="importacoes-table"
    />
  );
};

export default ImportacoesTable;
