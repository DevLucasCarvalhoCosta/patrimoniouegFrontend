import type { ImportacaoBemItem } from '@/interface/importacao';
import type { FC } from 'react';

import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

import StatusBadge from './StatusBadge';

interface ItensImportacaoTableProps {
  itens: ImportacaoBemItem[];
  loading?: boolean;
  onItemUpdate?: (item: ImportacaoBemItem) => void;
  onMapeamentoLocal?: (item: ImportacaoBemItem, codLocal: number) => void;
  onMapeamentoCategoria?: (item: ImportacaoBemItem, codCategoria: number) => void;
  pagination?: any;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
}

const { Text } = Typography;
const { Option } = Select;

const ItensImportacaoTable: FC<ItensImportacaoTableProps> = ({
  itens,
  loading = false,
  onItemUpdate,
  onMapeamentoLocal,
  onMapeamentoCategoria,
  pagination,
  onChange,
}) => {
  const { categorias, locais } = useSelector((state: any) => state.importacao);

  const formatCurrency = (value?: number): string => {
    if (!value) return 'N/A';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRowClassName = (status: string): string => {
    switch (status) {
      case 'READY':
        return 'bg-green-50 border-green-200';
      case 'DUPLICATE':
        return 'bg-orange-50 border-orange-200';
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      case 'CREATED':
        return 'bg-blue-50 border-blue-200';
      default:
        return '';
    }
  };

  const LocalMapeamento: FC<{ item: ImportacaoBemItem }> = ({ item }) => {
    if (item.cod_local && item.local) {
      return (
        <div>
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {item.local.nome_local}
          </Tag>
          {item.local.setor && <div className="text-xs text-gray-500 mt-1">{item.local.setor.nome_setor}</div>}
        </div>
      );
    }

    if (onMapeamentoLocal) {
      return (
        <Select
          size="small"
          placeholder="Mapear local..."
          style={{ width: 200 }}
          showSearch
          optionFilterProp="children"
          onChange={value => onMapeamentoLocal(item, value)}
          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        >
          {locais.map((local: any) => (
            <Option key={local.cod_local} value={local.cod_local}>
              {local.nome_local}
              {local.setor && (
                <Text type="secondary" className="ml-2 text-xs">
                  ({local.setor.nome_setor})
                </Text>
              )}
            </Option>
          ))}
        </Select>
      );
    }

    return (
      <Tag color="orange" icon={<WarningOutlined />}>
        {item.local_nome}
      </Tag>
    );
  };

  const CategoriaMapeamento: FC<{ item: ImportacaoBemItem }> = ({ item }) => {
    if (item.cod_categoria && item.categoria) {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {item.categoria.nome_categoria}
        </Tag>
      );
    }

    if (onMapeamentoCategoria) {
      return (
        <Select
          size="small"
          placeholder="Mapear categoria..."
          style={{ width: 200 }}
          showSearch
          optionFilterProp="children"
          onChange={value => onMapeamentoCategoria(item, value)}
          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        >
          {categorias.map((categoria: any) => (
            <Option key={categoria.cod_categoria} value={categoria.cod_categoria}>
              {categoria.nome_categoria}
              {categoria.codigo_categoria && (
                <Text type="secondary" className="ml-2 text-xs">
                  ({categoria.codigo_categoria})
                </Text>
              )}
            </Option>
          ))}
        </Select>
      );
    }

    return (
      <Tag color="orange" icon={<WarningOutlined />}>
        {item.classe || 'Não mapeado'}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status as any} size="sm" />,
      filters: [
        { text: 'Pendente', value: 'PENDING' },
        { text: 'Pronto', value: 'READY' },
        { text: 'Duplicado', value: 'DUPLICATE' },
        { text: 'Erro', value: 'ERROR' },
        { text: 'Criado', value: 'CREATED' },
      ],
    },
    {
      title: 'Linha',
      dataIndex: 'row_index',
      key: 'row_index',
      width: 60,
      sorter: (a: ImportacaoBemItem, b: ImportacaoBemItem) => a.row_index - b.row_index,
    },
    {
      title: 'Patrimônio',
      dataIndex: 'numero_patrimonio',
      key: 'numero_patrimonio',
      width: 120,
      render: (patrimonio: string, record: ImportacaoBemItem) => (
        <div>
          <Text code className={patrimonio ? 'font-mono' : 'text-gray-400'}>
            {patrimonio || 'N/A'}
          </Text>
          {record.status === 'DUPLICATE' && (
            <Tooltip title="Patrimônio já existe no sistema">
              <WarningOutlined className="text-orange-500 ml-1" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Descrição do Bem',
      dataIndex: 'descricao',
      key: 'descricao',
      width: 300,
      render: (descricao: string, record: ImportacaoBemItem) => (
        <div>
          <div className="font-medium text-sm line-clamp-2">{descricao}</div>
          <div className="flex space-x-2 mt-1">
            {record.especie && (
              <Text type="secondary" className="text-xs">
                {record.especie}
              </Text>
            )}
            {record.marca && (
              <Text type="secondary" className="text-xs">
                • {record.marca}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Valor Atual',
      key: 'valor_atual',
      width: 120,
      render: (record: ImportacaoBemItem) => (
        <div>
          {record.valor_atual ? (
            <Text className="font-medium">{formatCurrency(record.valor_atual)}</Text>
          ) : record.valor_atual_raw ? (
            <Tooltip title={`Valor original: ${record.valor_atual_raw}`}>
              <Text type="secondary">
                Valor inválido
                <InfoCircleOutlined className="ml-1" />
              </Text>
            </Tooltip>
          ) : (
            <Text type="secondary">Não informado</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Local',
      key: 'local',
      width: 220,
      render: (record: ImportacaoBemItem) => <LocalMapeamento item={record} />,
    },
    {
      title: 'Categoria',
      key: 'categoria',
      width: 220,
      render: (record: ImportacaoBemItem) => <CategoriaMapeamento item={record} />,
    },
    {
      title: 'Detalhes/Erro',
      key: 'detalhes',
      width: 80,
      render: (record: ImportacaoBemItem) => (
        <div className="flex justify-center">
          {record.mensagem_erro && (
            <Tooltip title={record.mensagem_erro} overlayStyle={{ maxWidth: 300 }}>
              <ExclamationCircleOutlined className="text-red-500 cursor-help" />
            </Tooltip>
          )}
          {record.observacoes && (
            <Tooltip title={record.observacoes} overlayStyle={{ maxWidth: 300 }}>
              <InfoCircleOutlined className="text-blue-500 cursor-help ml-1" />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table<ImportacaoBemItem>
      columns={columns}
      dataSource={itens}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: 1200 }}
      size="small"
      rowClassName={record => getRowClassName(record.status)}
      className="itens-importacao-table"
    />
  );
};

export default ItensImportacaoTable;
