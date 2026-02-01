import type { FC } from 'react';

import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Tabs,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  ConfirmarImportacaoModal,
  ImportacaoProgress,
  ItensImportacaoTable,
  NormalizacaoMapeamentos,
  StatusBadge,
} from '@/components/business/importacao';
import { useImportacaoDetalhes, useImportacaoNotifications, useImportacaoPolling } from '@/hooks/useImportacao';
import {
  cancelarImportacao,
  excluirImportacao,
  reprocessarNormalizacao,
  setAbaAtiva,
  setFiltrosItens,
  setModalConfirmacaoOpen,
  setPaginacaoItens,
} from '@/stores/importacao.store';

const { Title, Text } = Typography;
const { Option } = Select;

const ImportacaoDetalhesPage: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const [searchParams] = useSearchParams();

  const { abaAtiva, filtrosItens, paginacaoItens, userProfile } = useSelector((state: any) => state.importacao);
  const [buscaLocal, setBuscaLocal] = useState('');

  // Usar hooks personalizados
  const {
    importacao,
    itens,
    dadosNormalizacao,
    loading,
    loadingItens,
    loadingNormalizacao,
    podeConfirmar,
    estatisticasItens,
    recarregarDados,
    recarregarItens,
  } = useImportacaoDetalhes(id);

  useImportacaoPolling(id);
  useImportacaoNotifications();

  const isAdmin = userProfile?.perfil === 'admin';

  useEffect(() => {
    // Verificar se deve abrir modal de confirmação
    const acao = searchParams.get('acao');

    if (acao === 'confirmar' && podeConfirmar) {
      dispatch(setModalConfirmacaoOpen(true));
    }
  }, [searchParams, podeConfirmar, dispatch]);

  const handleTabChange = (key: string) => {
    dispatch(setAbaAtiva(key as any));
  };

  const handleBuscarItens = () => {
    const novosFiltros = {
      ...filtrosItens,
      busca: buscaLocal.trim(),
    };

    dispatch(setFiltrosItens(novosFiltros));
    dispatch(setPaginacaoItens({ current: 1 }));
  };

  const handleLimparFiltros = () => {
    setBuscaLocal('');
    dispatch(
      setFiltrosItens({
        status: [],
        busca: '',
        localMapeado: null,
        categoriaMapeada: null,
        comErro: null,
      }),
    );
    dispatch(setPaginacaoItens({ current: 1 }));
  };

  const handleConfirmar = () => {
    dispatch(setModalConfirmacaoOpen(true));
  };

  const handleCancelar = async () => {
    if (!importacao) return;

    try {
      await dispatch(
        cancelarImportacao({
          importacaoId: importacao.id,
          motivo: 'Cancelado pelo usuário',
        }) as any,
      ).unwrap();

      message.success('Importação cancelada com sucesso');
      navigate('/admin/importacao');
    } catch (error: any) {
      message.error(error.message || 'Erro ao cancelar importação');
    }
  };

  const handleExcluir = async () => {
    if (!importacao) return;

    try {
      await dispatch(excluirImportacao(importacao.id) as any).unwrap();
      message.success('Importação excluída com sucesso');
      navigate('/admin/importacao');
    } catch (error: any) {
      message.error(error.message || 'Erro ao excluir importação');
    }
  };

  const handleReprocessar = async () => {
    if (!importacao) return;

    try {
      await dispatch(reprocessarNormalizacao(importacao.id) as any).unwrap();
      message.success('Normalização reprocessada com sucesso');
      recarregarItens();
    } catch (error: any) {
      message.error(error.message || 'Erro ao reprocessar');
    }
  };

  const handleItensTableChange = (newPagination: any, filters: any, sorter: any) => {
    dispatch(
      setPaginacaoItens({
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      }),
    );
  };

  if (!importacao) {
    return (
      <div className="p-6">
        <Card loading={loading}>
          <div className="text-center py-8">
            <Text>Carregando dados da importação...</Text>
          </div>
        </Card>
      </div>
    );
  }

  const calcularProgresso = () => {
    const total = importacao.total_linhas;

    if (total === 0) return 0;
    const processados = importacao.criadas + importacao.ignoradas + importacao.com_erro;

    return Math.round((processados / total) * 100);
  };

  const tabItems = [
    {
      key: 'geral',
      label: (
        <Space>
          <InfoCircleOutlined />
          Informações Gerais
        </Space>
      ),
      children: (
        <div className="space-y-6">
          {/* Informações do arquivo */}
          <Card title="Detalhes do Arquivo" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <div className="space-y-3">
                  <div>
                    <Text type="secondary">Nome do arquivo:</Text>
                    <div className="font-medium">{importacao.arquivo_nome}</div>
                  </div>
                  <div>
                    <Text type="secondary">Data de upload:</Text>
                    <div>{dayjs(importacao.created_at).format('DD/MM/YYYY HH:mm')}</div>
                  </div>
                  <div>
                    <Text type="secondary">Usuário:</Text>
                    <div>
                      {importacao.usuario.nome} ({importacao.usuario.email})
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="space-y-3">
                  <div>
                    <Text type="secondary">Status:</Text>
                    <div className="mt-1">
                      <StatusBadge status={importacao.status} />
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">Última atualização:</Text>
                    <div>{dayjs(importacao.updated_at).format('DD/MM/YYYY HH:mm')}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Progresso visual */}
          <Card title="Progresso da Importação" size="small">
            <ImportacaoProgress importacao={importacao} />
          </Card>

          {/* Estatísticas */}
          <Card title="Estatísticas dos Itens" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="Total de Linhas" value={importacao.total_linhas} valueStyle={{ color: '#1890ff' }} />
              </Col>
              <Col span={6}>
                <Statistic title="Prontos" value={estatisticasItens.prontos} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title="Duplicados" value={estatisticasItens.duplicados} valueStyle={{ color: '#faad14' }} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Com Erro"
                  value={estatisticasItens.erros + estatisticasItens.pendentes}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>

          {/* Alertas e ações */}
          {importacao.status === 'PARSED' && (
            <Alert
              message="Importação processada"
              description="Os dados foram extraídos do PDF. Revise os itens na aba 'Itens Extraídos' e faça os mapeamentos necessários na aba 'Normalização'."
              type="info"
              showIcon
              action={
                podeConfirmar ? (
                  <Button size="small" type="primary" onClick={handleConfirmar}>
                    Confirmar Agora
                  </Button>
                ) : (
                  <Button size="small" onClick={() => dispatch(setAbaAtiva('normalizacao'))}>
                    Ir para Normalização
                  </Button>
                )
              }
            />
          )}

          {importacao.status === 'CONFIRMED' && (
            <Alert
              message="Importação confirmada com sucesso!"
              description={`${importacao.criadas} bens foram criados no sistema. Você pode visualizá-los na listagem geral de bens.`}
              type="success"
              showIcon
            />
          )}

          {(importacao.status === 'CANCELLED' || importacao.status === 'FAILED') && (
            <Alert
              message={`Importação ${importacao.status === 'CANCELLED' ? 'cancelada' : 'falhou'}`}
              description="Esta importação não será processada. Os dados temporários podem ser mantidos para análise."
              type="error"
              showIcon
            />
          )}
        </div>
      ),
    },
    {
      key: 'itens',
      label: (
        <Space>
          <CheckCircleOutlined />
          Itens Extraídos
          {itens.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{itens.length}</span>
          )}
        </Space>
      ),
      children: (
        <div className="space-y-4">
          {/* Filtros da tabela de itens */}
          <Card size="small">
            <Row gutter={16} align="middle">
              <Col xs={24} sm={8} md={6}>
                <Input
                  placeholder="Buscar por descrição, patrimônio..."
                  prefix={<SearchOutlined />}
                  value={buscaLocal}
                  onChange={e => setBuscaLocal(e.target.value)}
                  onPressEnter={handleBuscarItens}
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  mode="multiple"
                  placeholder="Status dos itens"
                  style={{ width: '100%' }}
                  value={filtrosItens.status}
                  onChange={value => dispatch(setFiltrosItens({ ...filtrosItens, status: value }))}
                >
                  <Option value="PENDING">Pendente</Option>
                  <Option value="READY">Pronto</Option>
                  <Option value="DUPLICATE">Duplicado</Option>
                  <Option value="ERROR">Erro</Option>
                  <Option value="CREATED">Criado</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Mapeamento"
                  style={{ width: '100%' }}
                  value={filtrosItens.localMapeado}
                  onChange={value => dispatch(setFiltrosItens({ ...filtrosItens, localMapeado: value }))}
                  allowClear
                >
                  <Option value={true}>Local mapeado</Option>
                  <Option value={false}>Local não mapeado</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={6}>
                <Space>
                  <Button icon={<SearchOutlined />} onClick={handleBuscarItens} type="primary" size="small">
                    Buscar
                  </Button>
                  <Button icon={<FilterOutlined />} onClick={handleLimparFiltros} size="small">
                    Limpar
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabela de itens */}
          <Card>
            <ItensImportacaoTable
              itens={itens}
              loading={loadingItens}
              pagination={{
                current: paginacaoItens.current,
                pageSize: paginacaoItens.pageSize,
                total: paginacaoItens.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} de ${total} itens`,
              }}
              onChange={handleItensTableChange}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'normalizacao',
      label: (
        <Space>
          <ExclamationCircleOutlined />
          Normalização
          {dadosNormalizacao && dadosNormalizacao.total_problemas > 0 && (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
              {dadosNormalizacao.total_problemas}
            </span>
          )}
        </Space>
      ),
      children: <NormalizacaoMapeamentos importacaoId={id!} />,
    },
  ];

  if (!importacao) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/importacao')}
            className="p-0"
          >
            Importações
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{importacao.arquivo_nome}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={3} className="mb-1">
            <FileTextOutlined className="mr-2" />
            {importacao.arquivo_nome}
          </Title>
          <Space>
            <StatusBadge status={importacao.status} />
            <Text type="secondary">Importado em {dayjs(importacao.created_at).format('DD/MM/YYYY HH:mm')}</Text>
          </Space>
        </div>

        <Space>
          {importacao.status === 'PARSED' && isAdmin && (
            <>
              <Button icon={<ReloadOutlined />} onClick={handleReprocessar} loading={loadingNormalizacao}>
                Reprocessar
              </Button>

              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirmar} disabled={!podeConfirmar}>
                Confirmar Importação
              </Button>

              <Popconfirm
                title="Cancelar importação? Esta ação não pode ser desfeita."
                onConfirm={handleCancelar}
                okText="Sim"
                cancelText="Não"
              >
                <Button danger icon={<CloseCircleOutlined />}>
                  Cancelar
                </Button>
              </Popconfirm>
            </>
          )}

          {(importacao.status === 'CANCELLED' || importacao.status === 'FAILED') && isAdmin && (
            <Popconfirm
              title="Excluir importação? Esta ação não pode ser desfeita."
              onConfirm={handleExcluir}
              okText="Sim"
              cancelText="Não"
            >
              <Button danger icon={<CloseCircleOutlined />}>
                Excluir
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Conteúdo em abas */}
      <Card>
        <Tabs activeKey={abaAtiva} onChange={handleTabChange} items={tabItems} size="large" />
      </Card>

      {/* Modal de Confirmação */}
      <ConfirmarImportacaoModal importacao={importacao} />
    </div>
  );
};

export default ImportacaoDetalhesPage;
