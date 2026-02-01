import type { Transferencia } from '@/interface/entities';
import type { FC } from 'react';

import { FilterOutlined, ReloadOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Input, message, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { apiListLocaisProtected } from '@/api/locais.api';
import { apiListTransferencias } from '@/api/transferencias.api';
import { apiGetAllUsers } from '@/api/user.api';
import TransferenciasTable from '@/components/business/transferencia/TransferenciasTable';
import ExportButtons from '@/components/common/ExportButtons';

const { Title } = Typography;
const { Option } = Select;

const TransferenciasPage: FC = () => {
  const [loading, setLoading] = useState(false);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [searchText, setSearchText] = useState('');

  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    cod_local_origem: undefined as number | undefined,
    cod_local_destino: undefined as number | undefined,
    id_usuario_responsavel: undefined as number | undefined,
    data_inicio: undefined as string | undefined,
    data_fim: undefined as string | undefined,
  });

  // Filtros aplicados (separados dos filtros em edição)
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    cod_local_origem: undefined as number | undefined,
    cod_local_destino: undefined as number | undefined,
    id_usuario_responsavel: undefined as number | undefined,
    data_inicio: undefined as string | undefined,
    data_fim: undefined as string | undefined,
  });

  // Dados para os selects
  const [locais, setLocais] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    loadTransferencias();
    loadFiltrosData();
  }, []);

  const loadFiltrosData = async () => {
    try {
      // Carregar locais para os filtros
      const locaisResponse = await apiListLocaisProtected();

      if (locaisResponse.status && locaisResponse.result) {
        setLocais(Array.isArray(locaisResponse.result) ? locaisResponse.result : []);
      }

      // Carregar usuários para os filtros
      const usuariosResponse = await apiGetAllUsers();

      if (usuariosResponse.status && usuariosResponse.result) {
        setUsuarios(Array.isArray(usuariosResponse.result) ? usuariosResponse.result : []);
      }
    } catch (error) {
      console.warn('Erro ao carregar dados dos filtros:', error);
    }
  };

  const loadTransferencias = async () => {
    setLoading(true);

    try {
      // Carregar TODAS as transferências sem filtros no backend
      const { status, result } = await apiListTransferencias();

      if (status && result) {
        // Backend retorna array direto
        const transferenciasArray: Transferencia[] = Array.isArray(result)
          ? result
          : (result as any)?.transferencias || [];

        setTransferencias(transferenciasArray);
      }
    } catch (error) {
      message.error('Erro ao carregar transferências');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadTransferencias();
  };

  const handleFiltroChange = (campo: string, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const aplicarFiltros = () => {
    // Copiar filtros para os filtros aplicados
    setFiltrosAplicados({ ...filtros });
    message.success('Filtros aplicados!');
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      cod_local_origem: undefined,
      cod_local_destino: undefined,
      id_usuario_responsavel: undefined,
      data_inicio: undefined,
      data_fim: undefined,
    };

    setFiltros(filtrosLimpos);
    setFiltrosAplicados(filtrosLimpos);
    setSearchText('');
  };

  const handleDateChange = (campo: 'data_inicio' | 'data_fim', date: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: date ? date.format('YYYY-MM-DD') : undefined,
    }));
  };

  const filteredTransferencias = transferencias.filter(item => {
    // Filtro por busca textual
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      const matchesSearch =
        item?.bem?.nome_bem?.toLowerCase().includes(search) ||
        item?.bem?.numero_patrimonio?.toLowerCase().includes(search) ||
        item?.localOrigem?.nome_local?.toLowerCase().includes(search) ||
        item?.localDestino?.nome_local?.toLowerCase().includes(search) ||
        item?.motivo?.toLowerCase().includes(search);

      if (!matchesSearch) return false;
    }

    // Filtro por local de origem (usar filtrosAplicados)
    if (filtrosAplicados.cod_local_origem && item?.localOrigem?.cod_local !== filtrosAplicados.cod_local_origem) {
      return false;
    }

    // Filtro por local de destino (usar filtrosAplicados)
    if (filtrosAplicados.cod_local_destino && item?.localDestino?.cod_local !== filtrosAplicados.cod_local_destino) {
      return false;
    }

    // Filtro por responsável (usar filtrosAplicados)
    if (
      filtrosAplicados.id_usuario_responsavel &&
      item?.usuarioResponsavel?.id_usuario !== filtrosAplicados.id_usuario_responsavel
    ) {
      return false;
    }

    // Filtro por data início (usar filtrosAplicados)
    if (filtrosAplicados.data_inicio && item?.data_transferencia) {
      const dataTransferencia = dayjs(item.data_transferencia);
      const dataInicio = dayjs(filtrosAplicados.data_inicio);

      if (dataTransferencia.isBefore(dataInicio, 'day')) {
        return false;
      }
    }

    // Filtro por data fim (usar filtrosAplicados)
    if (filtrosAplicados.data_fim && item?.data_transferencia) {
      const dataTransferencia = dayjs(item.data_transferencia);
      const dataFim = dayjs(filtrosAplicados.data_fim);

      if (dataTransferencia.isAfter(dataFim, 'day')) {
        return false;
      }
    }

    return true;
  });

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          Transferências de Bens
        </Space>
      }
      extra={
        <Space>
          <ExportButtons
            columns={[
              { title: 'Data', dataIndex: 'data_transferencia' } as any,
              { title: 'Bem', dataIndex: ['bem', 'nome_bem'] } as any,
              { title: 'Origem', dataIndex: ['localOrigem', 'nome_local'] } as any,
              { title: 'Destino', dataIndex: ['localDestino', 'nome_local'] } as any,
              { title: 'Responsável', dataIndex: ['usuarioResponsavel', 'nome'] } as any,
              { title: 'Motivo', dataIndex: 'motivo' } as any,
            ]}
            data={filteredTransferencias}
            filename={`transferencias-${new Date().toISOString().slice(0,10)}`}
            title="Transferências de Bens"
          />
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Atualizar
          </Button>
        </Space>
      }
    >
      {/* Filtros Avançados */}
      <Card
        title={
          <>
            <FilterOutlined /> Filtros
          </>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6} lg={4}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Local de Origem:</label>
              <Select
                placeholder="Todos"
                value={filtros.cod_local_origem}
                onChange={value => handleFiltroChange('cod_local_origem', value)}
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {locais.map(local => (
                  <Option key={local.cod_local} value={local.cod_local}>
                    {local.nome_local}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={8} md={6} lg={4}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Local de Destino:</label>
              <Select
                placeholder="Todos"
                value={filtros.cod_local_destino}
                onChange={value => handleFiltroChange('cod_local_destino', value)}
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {locais.map(local => (
                  <Option key={local.cod_local} value={local.cod_local}>
                    {local.nome_local}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={8} md={6} lg={4}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Responsável:</label>
              <Select
                placeholder="Todos"
                value={filtros.id_usuario_responsavel}
                onChange={value => handleFiltroChange('id_usuario_responsavel', value)}
                style={{ width: '100%' }}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {usuarios.map(usuario => (
                  <Option key={usuario.id_usuario} value={usuario.id_usuario}>
                    {usuario.nome}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          <Col xs={24} sm={8} md={6} lg={3}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Data Início:</label>
              <DatePicker
                value={filtros.data_inicio ? dayjs(filtros.data_inicio) : null}
                onChange={date => handleDateChange('data_inicio', date)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Início"
              />
            </Space>
          </Col>

          <Col xs={24} sm={8} md={6} lg={3}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Data Fim:</label>
              <DatePicker
                value={filtros.data_fim ? dayjs(filtros.data_fim) : null}
                onChange={date => handleDateChange('data_fim', date)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Fim"
              />
            </Space>
          </Col>

          <Col xs={24} sm={8} md={6} lg={6}>
            <Space style={{ marginTop: 20 }}>
              <Button type="primary" icon={<SearchOutlined />} onClick={aplicarFiltros}>
                Aplicar
              </Button>
              <Button onClick={limparFiltros}>Limpar</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Busca de Texto */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Buscar por nome do bem, patrimônio, local ou motivo..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 400 }}
        />
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          Atualizar
        </Button>
      </Space>

      <TransferenciasTable
        transferencias={filteredTransferencias}
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} de ${total} transferências`,
        }}
      />
    </Card>
  );
};

export default TransferenciasPage;
