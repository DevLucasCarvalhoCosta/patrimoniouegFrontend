import type { Bem } from '@/interface/entities';
import type { FC } from 'react';

import { EnvironmentOutlined, SearchOutlined, SwapOutlined, TagOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Empty, Input, List, message, Row, Space, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { apiListBensTangiveis } from '@/api/bens.api';
import TransferenciaModal from '@/components/business/transferencia/TransferenciaModal';
import { buildAssetUrl } from '@/config/api';
import { useBensRefreshListener } from '@/hooks/useBensRefresh';

const { Search } = Input;
const { Text, Title } = Typography;

const ExecutarTransferenciaPage: FC = () => {
  const [bens, setBens] = useState<Bem[]>([]);
  const [bensFiltered, setBensFiltered] = useState<Bem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBem, setSelectedBem] = useState<Bem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadBens();
  }, []);

  useEffect(() => {
    filterBens();
  }, [searchText, bens]);

  const loadBens = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiListBensTangiveis();

      if (status && result) {
        setBens(result as Bem[]);
      }
    } catch (error) {
      message.error('Erro ao carregar bens');
    } finally {
      setLoading(false);
    }
  };

  // Escutar notificações para atualizar os bens
  useBensRefreshListener(loadBens);

  const filterBens = () => {
    if (!searchText.trim()) {
      setBensFiltered(bens);

      return;
    }

    const filtered = bens.filter(
      bem =>
        bem.nome_bem.toLowerCase().includes(searchText.toLowerCase()) ||
        bem.numero_patrimonio.toLowerCase().includes(searchText.toLowerCase()) ||
        bem.local?.nome_local?.toLowerCase().includes(searchText.toLowerCase()) ||
        bem.categoria?.nome_categoria?.toLowerCase().includes(searchText.toLowerCase()),
    );

    setBensFiltered(filtered);
  };

  const handleTransferencia = (bem: Bem) => {
    setSelectedBem(bem);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setSelectedBem(null);
    loadBens(); // Recarregar para atualizar as informações
    message.success('Transferência realizada com sucesso!');
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setSelectedBem(null);
  };

  const renderBemItem = (bem: Bem) => (
    <List.Item
      key={bem.cod_bem}
      actions={[
        <Button type="primary" icon={<SwapOutlined />} onClick={() => handleTransferencia(bem)} size="small">
          Transferir
        </Button>,
      ]}
    >
      <List.Item.Meta
        avatar={(() => {
          const cat = bem.categoria;
          const srcs = [
            cat?.imagem1,
            cat?.imagem2,
            cat?.imagem3,
            cat?.imagem4,
            cat?.imagem5,
            cat?.imagem6,
            cat?.imagem7,
            cat?.imagem8,
            cat?.imagem9,
            cat?.imagem10,
          ]
            .map(s => (s && String(s).trim() ? String(s) : ''))
            .filter(Boolean) as string[];
          const first = srcs[0];

          return <Avatar size={64} src={buildAssetUrl(first)} icon={<TagOutlined />} shape="square" />;
        })()}
        title={
          <Space direction="vertical" size={4}>
            <Text strong>{bem.nome_bem}</Text>
            <Text code type="secondary">
              {bem.numero_patrimonio}
            </Text>
          </Space>
        }
        description={
          <Space direction="vertical" size={4}>
            <div>
              <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
              <Text>{bem.local?.nome_local || 'Local não definido'}</Text>
              {bem.local?.setor && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({bem.local.setor.nome_setor})
                </Text>
              )}
            </div>

            {bem.categoria && (
              <div>
                <TagOutlined style={{ marginRight: 4, color: '#722ed1' }} />
                <Text type="secondary">{bem.categoria.nome_categoria}</Text>
              </div>
            )}

            {bem.estado_conservacao && (
              <div>
                <Tag
                  color={
                    bem.estado_conservacao === 'Excelente'
                      ? 'green'
                      : bem.estado_conservacao === 'Bom'
                      ? 'blue'
                      : bem.estado_conservacao === 'Regular'
                      ? 'orange'
                      : 'red'
                  }
                >
                  {bem.estado_conservacao}
                </Tag>
              </div>
            )}

            {bem.descricao && (
              <Text type="secondary" ellipsis style={{ fontSize: '12px', maxWidth: 300 }}>
                {bem.descricao}
              </Text>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SwapOutlined /> Executar Transferência
        </Title>
        <Text type="secondary">Selecione um bem para transferir para outro local</Text>
      </div>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={16} md={12} lg={8}>
            <Search
              placeholder="Buscar bem por nome, patrimônio, local ou categoria..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={filterBens}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </Col>
          <Col xs={24} sm={8} md={12} lg={4}>
            <Text type="secondary">
              {bensFiltered.length} ben{bensFiltered.length !== 1 ? 's' : ''} encontrado
              {bensFiltered.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          {bensFiltered.length > 0 ? (
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={bensFiltered}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} bens`,
              }}
              renderItem={renderBemItem}
            />
          ) : (
            !loading && <Empty description="Nenhum bem encontrado" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </Card>

      <TransferenciaModal
        open={modalOpen}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        bem={selectedBem}
      />
    </div>
  );
};

export default ExecutarTransferenciaPage;
