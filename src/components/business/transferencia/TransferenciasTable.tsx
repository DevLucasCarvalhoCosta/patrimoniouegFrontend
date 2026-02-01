import type { Transferencia } from '@/interface/entities';
import type { FC } from 'react';

import { EnvironmentOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';
import { Space, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

interface TransferenciasTableProps {
  transferencias: Transferencia[];
  loading?: boolean;
  showBemColumn?: boolean;
  showUserColumn?: boolean;
  pagination?: any;
  onChange?: (pagination: any) => void;
}

const { Text } = Typography;

const TransferenciasTable: FC<TransferenciasTableProps> = ({
  transferencias,
  loading = false,
  showBemColumn = true,
  showUserColumn = true,
  pagination,
  onChange,
}) => {
  const columns: any[] = [
    {
      title: 'Data',
      dataIndex: 'data_transferencia',
      key: 'data_transferencia',
      width: 120,
      sorter: (a: Transferencia, b: Transferencia) => {
        const ta = dayjs(a?.data_transferencia).valueOf();
        const tb = dayjs(b?.data_transferencia).valueOf();

        if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;

        return ta - tb;
      },
      render: (date: unknown) => {
        try {
          if (!date || typeof date !== 'string') return '-';

          return dayjs(date).format('DD/MM/YYYY HH:mm');
        } catch {
          return '-';
        }
      },
    },
  ];

  // Coluna de Bem (condicional)
  if (showBemColumn) {
    // Coluna Número do Patrimônio primeiro
    columns.push({
      title: 'Nº Patrimônio',
      key: 'numero_patrimonio',
      width: 120,
      render: (record: Transferencia) => (
        <Text code type="secondary">
          {record?.bem?.numero_patrimonio || 'N/A'}
        </Text>
      ),
    });

    // Coluna Bem depois
    columns.push({
      title: 'Bem',
      key: 'bem',
      width: 180,
      render: (record: Transferencia) => (
        <div>
          <Text strong>{record?.bem?.nome_bem || 'N/A'}</Text>
        </div>
      ),
    });
  }

  columns.push(
    {
      title: 'Origem',
      key: 'origem',
      width: 180,
      render: (record: Transferencia) => (
        <div>
          <div>
            <EnvironmentOutlined style={{ marginRight: 4, color: '#f56a00' }} />
            <Text>{record?.localOrigem?.nome_local || 'N/A'}</Text>
          </div>
          {record?.localOrigem?.setor && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.localOrigem.setor.nome_setor}
                {record.localOrigem.setor.sigla && ` (${record.localOrigem.setor.sigla})`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <Space>
          <SwapOutlined />
          Destino
        </Space>
      ),
      key: 'destino',
      width: 180,
      render: (record: Transferencia) => (
        <div>
          <div>
            <EnvironmentOutlined style={{ marginRight: 4, color: '#52c41a' }} />
            <Text>{record?.localDestino?.nome_local || 'N/A'}</Text>
          </div>
          {record?.localDestino?.setor && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.localDestino.setor.nome_setor}
                {record.localDestino.setor.sigla && ` (${record.localDestino.setor.sigla})`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
  );

  // Coluna de Responsável (condicional)
  if (showUserColumn) {
    columns.push({
      title: 'Responsável',
      key: 'responsavel',
      width: 150,
      render: (record: Transferencia) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text>{record?.usuarioResponsavel?.nome || 'N/A'}</Text>
        </Space>
      ),
    });
  }

  columns.push(
    {
      title: 'Motivo',
      dataIndex: 'motivo',
      key: 'motivo',
      width: 150,
      ellipsis: true,
      render: (motivo: string) =>
        motivo ? (
          <Tooltip title={motivo}>
            <Text>{motivo}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary" italic>
            Não informado
          </Text>
        ),
    },
    {
      title: 'Estado de Conservação',
      key: 'estado_conservacao',
      width: 150,
      render: (record: Transferencia) => {
        const estado = record?.bem?.estado_conservacao;

        if (!estado)
          return (
            <Text type="secondary" italic>
              Não informado
            </Text>
          );

        return (
          <Tag
            color={
              estado === 'Excelente' ? 'green' : estado === 'Bom' ? 'blue' : estado === 'Regular' ? 'orange' : 'red'
            }
          >
            {estado}
          </Tag>
        );
      },
    },
    {
      title: 'Observações',
      dataIndex: 'observacoes',
      key: 'observacoes',
      width: 200,
      ellipsis: true,
      render: (observacoes: string) =>
        observacoes ? (
          <Tooltip title={observacoes}>
            <Text>{observacoes}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary" italic>
            Nenhuma
          </Text>
        ),
    },
  );

  return (
    <Table
      dataSource={transferencias || []}
      columns={columns}
      loading={loading}
      rowKey={record => record?.cod_transferencia || Math.random()}
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: 1200 }}
      size="small"
    />
  );
};

export default TransferenciasTable;
