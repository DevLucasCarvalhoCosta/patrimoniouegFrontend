import type { EstatisticasTransferencias } from '@/interface/entities';
import type { FC } from 'react';

import { ApartmentOutlined, EnvironmentOutlined, RiseOutlined, SwapOutlined } from '@ant-design/icons';
import { Card, Col, List, Progress, Row, Statistic } from 'antd';
import React from 'react';

interface EstatisticasTransferenciasProps {
  dados: EstatisticasTransferencias;
  loading?: boolean;
}

const EstatisticasTransferenciasCard: FC<EstatisticasTransferenciasProps> = ({ dados, loading = false }) => {
  const variacao =
    dados.transferencias_mes_anterior > 0
      ? ((dados.transferencias_mes_atual - dados.transferencias_mes_anterior) / dados.transferencias_mes_anterior) * 100
      : dados.transferencias_mes_atual > 0
      ? 100
      : 0;

  const maxTransferenciasSetor = Math.max(...dados.por_setor.map(s => s.total), 1);
  const maxTransferenciasLocal = Math.max(...dados.por_local.map(l => l.total), 1);

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* Cards de Resumo */}
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Total de Transferências" value={dados.total_transferencias} prefix={<SwapOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Este Mês"
              value={dados.transferencias_mes_atual}
              prefix={<RiseOutlined />}
              valueStyle={{
                color: variacao >= 0 ? '#3f8600' : '#cf1322',
              }}
              suffix={
                variacao !== 0 && (
                  <span style={{ fontSize: 14 }}>
                    ({variacao > 0 ? '+' : ''}
                    {variacao.toFixed(1)}%)
                  </span>
                )
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Mês Anterior" value={dados.transferencias_mes_anterior} prefix={<RiseOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Transferências por Setor */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <ApartmentOutlined /> Transferências por Setor
              </span>
            }
            loading={loading}
          >
            <List
              size="small"
              dataSource={dados.por_setor.slice(0, 10)}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span>{item.nome_setor}</span>
                      <span>
                        <strong>{item.total}</strong>
                      </span>
                    </div>
                    <Progress
                      percent={(item.total / maxTransferenciasSetor) * 100}
                      showInfo={false}
                      size="small"
                      strokeColor="#1890ff"
                    />
                  </div>
                </List.Item>
              )}
            />
            {dados.por_setor.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>Nenhuma transferência encontrada</div>
            )}
          </Card>
        </Col>

        {/* Transferências por Local */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <EnvironmentOutlined /> Transferências por Local
              </span>
            }
            loading={loading}
          >
            <List
              size="small"
              dataSource={dados.por_local.slice(0, 10)}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span>{item.nome_local}</span>
                      <span>
                        <strong>{item.total}</strong>
                      </span>
                    </div>
                    <Progress
                      percent={(item.total / maxTransferenciasLocal) * 100}
                      showInfo={false}
                      size="small"
                      strokeColor="#52c41a"
                    />
                  </div>
                </List.Item>
              )}
            />
            {dados.por_local.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>Nenhuma transferência encontrada</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top Bens Transferidos (se disponível) */}
      {dados.top_bens_transferidos && dados.top_bens_transferidos.length > 0 && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="Bens Mais Transferidos" loading={loading}>
              <List
                size="small"
                dataSource={dados.top_bens_transferidos.slice(0, 10)}
                renderItem={(item, index) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>#{index + 1}</strong> {item.nome_bem}
                          <div style={{ fontSize: 12, color: '#666' }}>{item.numero_patrimonio}</div>
                        </div>
                        <span
                          style={{
                            background: '#f0f0f0',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        >
                          {item.total_transferencias} transferência{item.total_transferencias !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default EstatisticasTransferenciasCard;
