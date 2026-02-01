import type { ImportacaoBem } from '@/interface/importacao';
import type { Dayjs } from 'dayjs';
import type { FC } from 'react';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Input, message, Popconfirm, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { EstatisticasCard, ImportacoesTable, UploadPDFModal, NovaImportacaoLotePDFModal, ImportacaoOpenDataModal } from '@/components/business/importacao';
import ExportButtons from '@/components/common/ExportButtons';
import {
  cancelarImportacao,
  carregarDadosAuxiliares,
  excluirImportacao,
  listarImportacoes,
  obterEstatisticas,
  reprocessarNormalizacao,
  setFiltros,
  setModalUploadOpen,
  setPaginacao,
} from '@/stores/importacao.store';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ImportacaoListPage: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { importacoes, loading, estatisticas, filtros, paginacao, userProfile } = useSelector(
    (state: any) => state.importacao,
  );

  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
  const [dataRange, setDataRange] = useState<any>(null);
  const [modalLoteOpen, setModalLoteOpen] = useState(false);
  const [modalOpenDataOpen, setModalOpenDataOpen] = useState(false);

  const isAdmin = userProfile?.perfil === 'admin';

  useEffect(() => {
    loadData();
    dispatch(obterEstatisticas() as any);
    dispatch(carregarDadosAuxiliares() as any);
  }, []);

  useEffect(() => {
    loadData();
  }, [filtros, paginacao.current, paginacao.pageSize]);

  const loadData = () => {
    const params = {
      ...filtros,
      page: paginacao.current,
      limit: paginacao.pageSize,
    };

    dispatch(listarImportacoes(params) as any);
  };

  const handleSearch = () => {
    const newFiltros = {
      busca: busca.trim() || undefined,
      status: statusFiltro.length > 0 ? (statusFiltro as any) : undefined,
      data_inicio: dataRange?.[0]?.format('YYYY-MM-DD'),
      data_fim: dataRange?.[1]?.format('YYYY-MM-DD'),
    };

    dispatch(setFiltros(newFiltros));
    dispatch(setPaginacao({ current: 1 }));
  };

  const handleClearFilters = () => {
    setBusca('');
    setStatusFiltro([]);
    setDataRange(null);
    dispatch(setFiltros({}));
    dispatch(setPaginacao({ current: 1 }));
  };

  const handleView = (importacao: ImportacaoBem) => {
    navigate(`/admin/importacao/${importacao.id}`);
  };

  const handleConfirmar = async (importacao: ImportacaoBem) => {
    // Navegar para a página de detalhes para revisão antes da confirmação
    navigate(`/admin/importacao/${importacao.id}?acao=confirmar`);
  };

  const handleCancelar = async (importacao: ImportacaoBem) => {
    try {
      await dispatch(
        cancelarImportacao({
          importacaoId: importacao.id,
          motivo: 'Cancelado pelo usuário',
        }) as any,
      ).unwrap();

      message.success('Importação cancelada com sucesso');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Erro ao cancelar importação');
    }
  };

  const handleExcluir = async (importacao: ImportacaoBem) => {
    try {
      await dispatch(excluirImportacao(importacao.id) as any).unwrap();
      message.success('Importação excluída com sucesso');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Erro ao excluir importação');
    }
  };

  const handleReprocessar = async (importacao: ImportacaoBem) => {
    try {
      await dispatch(reprocessarNormalizacao(importacao.id) as any).unwrap();
      message.success('Normalização reprocessada com sucesso');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Erro ao reprocessar');
    }
  };

  const handleUploadSuccess = (importacaoId: string) => {
    message.success('PDF processado com sucesso!');
    navigate(`/admin/importacao/${importacaoId}`);
  };

  const handleLoteSuccess = (resultado: any) => {
    message.success('Importação em lote executada com sucesso!');
    setModalLoteOpen(false);
    loadData(); // Recarregar lista
  };

  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    dispatch(
      setPaginacao({
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      }),
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Title level={3} className="mb-1">
              <FileTextOutlined className="mr-2" />
              Importação de Bens
            </Title>
            <Typography.Text type="secondary">Gerencie importações de bens via relatórios PDF da UEG</Typography.Text>
          </div>
          <Space>
            <ExportButtons
              columns={[
                { title: 'Arquivo', dataIndex: 'arquivo_nome' } as any,
                { title: 'Status', dataIndex: 'status' } as any,
                { title: 'Total Linhas', dataIndex: 'total_linhas' } as any,
                { title: 'Criadas', dataIndex: 'criadas' } as any,
                { title: 'Ignoradas', dataIndex: 'ignoradas' } as any,
                { title: 'Com Erro', dataIndex: 'com_erro' } as any,
                { title: 'Usuário', dataIndex: ['usuario','nome'] } as any,
                { title: 'Criado em', dataIndex: 'created_at' } as any,
              ]}
              data={importacoes || []}
              filename={`importacoes-${new Date().toISOString().slice(0,10)}`}
              title="Importações de Bens"
              subtitle={(() => {
                const parts: string[] = [];
                if (busca) parts.push(`Busca: ${busca}`);
                if (statusFiltro?.length) parts.push(`Status: ${statusFiltro.join(',')}`);
                if (dataRange?.[0] || dataRange?.[1]) {
                  const s = dataRange?.[0]?.format('YYYY-MM-DD');
                  const e = dataRange?.[1]?.format('YYYY-MM-DD');
                  parts.push(`Período: ${s || '...'} a ${e || '...'}`);
                }
                return parts.join(' | ') || undefined;
              })()}
            />
            <Button
              type="default"
              icon={<CloudUploadOutlined />}
              onClick={() => setModalOpenDataOpen(true)}
              size="large"
            >
              Importar do Dados Abertos
            </Button>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/importacao/lote')}
              size="large"
            >
              Importação em Lote
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => dispatch(setModalUploadOpen(true))}
              size="large"
            >
              Nova Importação
            </Button>
          </Space>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <EstatisticasCard
                titulo="Total Processadas"
                valor={estatisticas.total_importacoes}
                cor="blue"
                icone={<FileTextOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <EstatisticasCard
                titulo="Bens Importados"
                valor={estatisticas.total_bens_importados}
                cor="green"
                icone={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <EstatisticasCard
                titulo="Pendentes"
                valor={estatisticas.importacoes_pendentes}
                cor="yellow"
                icone={<ClockCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <EstatisticasCard
                titulo="Esta Semana"
                valor={estatisticas.importacoes_semana}
                cor="purple"
                icone={<ExclamationCircleOutlined />}
              />
            </Col>
          </Row>
        )}
      </div>

      {/* Filtros */}
      <Card size="small" className="mb-4">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Buscar por arquivo..."
              prefix={<SearchOutlined />}
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              mode="multiple"
              placeholder="Status"
              style={{ width: '100%' }}
              value={statusFiltro}
              onChange={setStatusFiltro}
            >
              <Option value="PARSED">Processado</Option>
              <Option value="CONFIRMED">Confirmado</Option>
              <Option value="CANCELLED">Cancelado</Option>
              <Option value="FAILED">Falhou</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dataRange}
              onChange={values => setDataRange(values as any)}
              format="DD/MM/YYYY"
              placeholder={['Data início', 'Data fim']}
            />
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Button icon={<SearchOutlined />} onClick={handleSearch} type="primary">
                Buscar
              </Button>
              <Button icon={<FilterOutlined />} onClick={handleClearFilters}>
                Limpar
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                Atualizar
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tabela */}
      <Card>
        <ImportacoesTable
          importacoes={importacoes}
          loading={loading}
          onView={handleView}
          onConfirmar={handleConfirmar}
          onCancelar={handleCancelar}
          onExcluir={handleExcluir}
          onReprocessar={handleReprocessar}
          pagination={{
            current: paginacao.current,
            pageSize: paginacao.pageSize,
            total: paginacao.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} de ${total} importações`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal de Upload */}
      <UploadPDFModal onSuccess={handleUploadSuccess} />
      
      {/* Modal de Importação em Lote */}
      <NovaImportacaoLotePDFModal
        open={modalLoteOpen}
        onClose={() => setModalLoteOpen(false)}
        onSuccess={handleLoteSuccess}
      />

      {/* Modal de Importação do Dados Abertos */}
      <ImportacaoOpenDataModal
        open={modalOpenDataOpen}
        onClose={() => setModalOpenDataOpen(false)}
        onSuccess={handleLoteSuccess}
      />
    </div>
  );
};

export default ImportacaoListPage;
