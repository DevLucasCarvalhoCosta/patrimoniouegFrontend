import type { FC } from 'react';

import { CloudDownloadOutlined, InfoCircleOutlined, QuestionCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, List, Row, Space, Typography } from 'antd';
import React, { useState } from 'react';

import { ImportacaoOpenDataModal } from '@/components/business/importacao';

const { Title, Text, Paragraph } = Typography;

const ImportacaoLotePage: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSuccess = (resultado: any) => {
    setModalOpen(false);
    // Pode navegar para uma página de resultados ou atualizar lista
  };

  const funcionalidades = [
    {
      titulo: 'Dados Abertos (CKAN)',
      descricao: 'Busca direta no portal de Dados Abertos do Governo de Goiás (CKAN).',
      icone: <DatabaseOutlined />,
    },
    {
      titulo: 'Mapeamento Automático',
      descricao: 'Converte os campos do dataset para o formato interno de importação.',
      icone: <CloudDownloadOutlined />,
    },
    {
      titulo: 'Validação Prévia',
      descricao: 'Verifica duplicatas e problemas antes de importar.',
      icone: <InfoCircleOutlined />,
    },
    {
      titulo: 'Auto-criação',
      descricao: 'Cria automaticamente setores, locais e categorias ausentes.',
      icone: <QuestionCircleOutlined />,
    },
  ];

  const passos = [
    'Informe a Unidade Administrativa e busque no Dados Abertos',
    'Revise e edite os dados carregados na tabela',
    'Execute a validação para verificar problemas e duplicatas',
    'Confirme a importação para criar os bens no sistema',
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="mb-1">
          <CloudDownloadOutlined className="mr-2" />
          Importação de Bens via Dados Abertos
        </Title>
        <Paragraph type="secondary">
          Importe bens patrimoniais diretamente do portal de Dados Abertos de Goiás (CKAN). Busque por unidade
          administrativa, revise e importe para o sistema.
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {/* Coluna principal - Ação + Requisitos */}
        <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card bodyStyle={{ padding: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <CloudDownloadOutlined style={{ fontSize: 56, color: '#1890ff', marginBottom: 8 }} />
              <Title level={4} style={{ marginBottom: 8 }}>
                Importar do Dados Abertos
              </Title>
              <Typography.Paragraph style={{ marginBottom: 24 }}>
                Busque os bens patrimoniais por Unidade Administrativa e importe em lote.
              </Typography.Paragraph>

              <Button
                type="primary"
                size="large"
                icon={<CloudDownloadOutlined />}
                onClick={() => setModalOpen(true)}
                style={{ height: 44, padding: '0 28px' }}
              >
                Iniciar Importação
              </Button>
            </div>
          </Card>

          {/* Requisitos e Limitações abaixo do card principal */}
          <Card title="Requisitos e Limitações" bodyStyle={{ padding: 16 }} style={{ flex: 1 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Fonte dos Dados:
                </Title>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Portal Dados Abertos GO</strong> - Endpoint CKAN datastore_search
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Dataset</strong>: resource_id 8ce95179-562d-45d3-85a7-a60f05d411e9
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Filtro</strong>: unidade_administrativa
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Limite</strong>: 2000 registros por consulta (paginável)
                  </li>
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Campos Mapeados:
                </Title>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Número de patrimônio</strong> (tombamento)
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Nome/descrição</strong> (especie/descricao)
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Marca</strong>
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Número de série</strong>
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Setor e local</strong> (unidade_administrativa/localizacao)
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Valor de aquisição</strong>
                  </li>
                </ul>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Limitações Importantes:
                </Title>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>
                    Limite de 2000 por request; pode exigir paginação para volumes maiores
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    Qualidade dos dados depende do dataset público
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    Disponibilidade sujeita ao portal CKAN
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    Requer revisão manual antes da importação final
                  </li>
                </ul>
              </Col>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Funcionalidades Automáticas:
                </Title>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Criação automática</strong> de setores não existentes
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Criação automática</strong> de locais não existentes
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Validação de duplicatas</strong> por número patrimonial
                  </li>
                  <li style={{ marginBottom: 6 }}>
                    <strong>Detecção de inconsistências</strong> nos dados
                  </li>
                </ul>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Sidebar - Informações */}
        <Col xs={24} lg={8}>
          {/* Funcionalidades */}
          <Card title="Funcionalidades" className="mb-4" bodyStyle={{ padding: 16 }}>
            <List
              size="small"
              dataSource={funcionalidades}
              renderItem={item => (
                <List.Item style={{ padding: '6px 0', borderBottom: 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          color: '#1890ff',
                          fontSize: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                        }}
                      >
                        {item.icone}
                      </div>
                    }
                    title={<span style={{ fontSize: 14, fontWeight: 500 }}>{item.titulo}</span>}
                    description={<span style={{ fontSize: 12, lineHeight: 1.5 }}>{item.descricao}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Como funciona */}
          <Card title="Como Funciona" bodyStyle={{ padding: 16 }}>
            <List
              size="small"
              dataSource={passos}
              renderItem={(item, index) => (
                <List.Item style={{ padding: '6px 0', borderBottom: 'none' }}>
                  <Space align="start">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        backgroundColor: '#1890ff',
                        color: 'white',
                        borderRadius: '50%',
                        fontSize: 12,
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                    <Text style={{ fontSize: 13, lineHeight: 1.5 }}>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

  {/* Requisitos movido para a coluna esquerda acima; sem seção separada */}

      {/* Modal de importação via Dados Abertos */}
      <ImportacaoOpenDataModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />
    </div>
  );
};

export default ImportacaoLotePage;
