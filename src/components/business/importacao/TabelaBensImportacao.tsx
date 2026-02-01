import type { BemImportacao, ResultadoValidacao } from '@/interface/importacao';

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';

const { Text } = Typography;
const { Option } = Select;

interface Props {
  bens: BemImportacao[];
  validacao?: ResultadoValidacao | null;
  onEditBem: (index: number, campo: string, valor: any) => void;
  onRemoverBem: (index: number) => void;
  loading?: boolean;
}

const estadosConservacao = [
  { value: 'novo', label: 'Novo' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
  { value: 'péssimo', label: 'Péssimo' },
];

export const TabelaBensImportacao: React.FC<Props> = ({
  bens,
  validacao,
  onEditBem,
  onRemoverBem,
  loading = false,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const getItemValidacao = (index: number) => {
    return validacao?.validacao.itens.find(item => item.index === index);
  };

  const renderCampoEditavel = (
    value: any,
    index: number,
    campo: string,
    tipo: 'text' | 'number' | 'select' = 'text',
    opcoes?: Array<{ value: string; label: string }>
  ) => {
    const isEditing = editingIndex === index && editingField === campo;
    const itemValidacao = getItemValidacao(index);
    const hasError = itemValidacao && (!itemValidacao.valido || itemValidacao.duplicata);

    if (isEditing) {
      if (tipo === 'select' && opcoes) {
        return (
          <Select
            value={value}
            style={{ width: '100%' }}
            onChange={(val) => {
              onEditBem(index, campo, val);
              setEditingIndex(null);
              setEditingField(null);
            }}
            onBlur={() => {
              setEditingIndex(null);
              setEditingField(null);
            }}
            autoFocus
          >
            {opcoes.map(opcao => (
              <Option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </Option>
            ))}
          </Select>
        );
      }

      if (tipo === 'number') {
        return (
          <InputNumber
            value={value}
            style={{ width: '100%' }}
            onChange={(val) => {
              onEditBem(index, campo, val);
              setEditingIndex(null);
              setEditingField(null);
            }}
            onBlur={() => {
              setEditingIndex(null);
              setEditingField(null);
            }}
            autoFocus
          />
        );
      }

      return (
        <Input
          value={value}
          onChange={(e) => {
            onEditBem(index, campo, e.target.value);
          }}
          onBlur={() => {
            setEditingIndex(null);
            setEditingField(null);
          }}
          onPressEnter={() => {
            setEditingIndex(null);
            setEditingField(null);
          }}
          autoFocus
        />
      );
    }

    return (
      <div
        className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${hasError ? 'bg-red-50 text-red-600' : ''}`}
        onClick={() => {
          setEditingIndex(index);
          setEditingField(campo);
        }}
      >
        {value || '-'}
        {hasError && (
          <Tooltip title={itemValidacao?.erros.join(', ')}>
            <WarningOutlined className="ml-1 text-red-500" />
          </Tooltip>
        )}
      </div>
    );
  };

  const colunas: ColumnsType<BemImportacao> = [
    {
      title: 'Status',
      width: 80,
      render: (_, record, index) => {
        const item = getItemValidacao(index);
        if (!item) return null;

        if (item.duplicata) {
          return (
            <Tooltip title="Patrimônio duplicado">
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                Duplicata
              </Tag>
            </Tooltip>
          );
        }

        if (!item.valido) {
          return (
            <Tooltip title={item.erros.join(', ')}>
              <Tag color="orange" icon={<WarningOutlined />}>
                Erro
              </Tag>
            </Tooltip>
          );
        }

        return (
          <Tooltip title="Dados válidos">
            <Tag color="green" icon={<CheckCircleOutlined />}>
              OK
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'N° Patrimônio',
      dataIndex: 'numero_patrimonio',
      width: 120,
      render: (value, record, index) => renderCampoEditavel(value, index, 'numero_patrimonio'),
    },
    {
      title: 'Nome do Bem',
      dataIndex: 'nome_bem',
      width: 200,
      render: (value, record, index) => renderCampoEditavel(value, index, 'nome_bem'),
    },
    {
      title: 'Marca',
      dataIndex: 'marca',
      width: 120,
      render: (value, record, index) => renderCampoEditavel(value, index, 'marca'),
    },
    {
      title: 'Modelo',
      dataIndex: 'modelo',
      width: 120,
      render: (value, record, index) => renderCampoEditavel(value, index, 'modelo'),
    },
    {
      title: 'N° Série',
      dataIndex: 'numero_serie',
      width: 120,
      render: (value, record, index) => renderCampoEditavel(value, index, 'numero_serie'),
    },
    {
      title: 'Valor',
      dataIndex: 'valor_aquisicao',
      width: 120,
      render: (value, record, index) => renderCampoEditavel(value, index, 'valor_aquisicao', 'number'),
    },
    {
      title: 'Valor Atual',
      dataIndex: 'valor_atual',
      width: 120,
      render: (value, record, index) => renderCampoEditavel(value, index, 'valor_atual', 'number'),
    },
    {
      title: 'Estado',
      dataIndex: 'estado_conservacao',
      width: 100,
      render: (value, record, index) => 
        renderCampoEditavel(value, index, 'estado_conservacao', 'select', estadosConservacao),
    },
    {
      title: 'Local',
      dataIndex: ['local', 'nome_local'],
      width: 150,
      render: (value, record, index) => renderCampoEditavel(value, index, 'local.nome_local'),
    },
    {
      title: 'Setor',
      dataIndex: ['local', 'setor', 'nome_setor'],
      width: 150,
      render: (value, record, index) => renderCampoEditavel(value, index, 'local.setor.nome_setor'),
    },
    {
      title: 'Categoria',
      dataIndex: ['categoria', 'nome_categoria'],
      width: 150,
      render: (value, record, index) => renderCampoEditavel(value, index, 'categoria.nome_categoria'),
    },
    {
      title: 'Ações',
      width: 100,
      fixed: 'right',
      render: (_, record, index) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                // Implementar modal de edição completa se necessário
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Remover bem"
            onConfirm={() => onRemoverBem(index)}
            okText="Sim"
            cancelText="Não"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={colunas}
      dataSource={bens}
      rowKey={(record, index) => `${record.numero_patrimonio}-${index}`}
      pagination={{
        pageSize: 15,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} bens`,
      }}
      scroll={{ x: 1500, y: 500 }}
      size="small"
      loading={loading}
      rowClassName={(record, index) => {
        const item = getItemValidacao(index);
        if (item && (!item.valido || item.duplicata)) {
          return 'bg-red-50 border-red-200';
        }
        return '';
      }}
    />
  );
};

export default TabelaBensImportacao;
