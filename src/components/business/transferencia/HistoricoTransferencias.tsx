import type { Transferencia } from '@/interface/entities';
import type { FC } from 'react';

import { EnvironmentOutlined, HistoryOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Empty, List, Space, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import { apiGetTransferenciasBem } from '@/api/transferencias.api';

interface HistoricoTransferenciasProps {
  codBem: number;
}

const { Text, Title } = Typography;

const HistoricoTransferencias: FC<HistoricoTransferenciasProps> = ({ codBem }) => {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codBem) {
      loadTransferencias();
    }
  }, [codBem]);

  const loadTransferencias = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiGetTransferenciasBem(codBem);

      if (status && result) {
        setTransferencias(result);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de transferências:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card
        title={
          <span>
            <HistoryOutlined /> Histórico de Transferências
          </span>
        }
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <HistoryOutlined /> Histórico de Transferências
        </span>
      }
    >
      {transferencias.length > 0 ? (
        <List
          dataSource={transferencias}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<HistoryOutlined style={{ color: '#1890ff' }} />}
                title={
                  <Space wrap>
                    <Text strong>{dayjs(item.data_transferencia).format('DD/MM/YYYY HH:mm')}</Text>
                    {item.motivo && <Tag color="blue">{item.motivo}</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <EnvironmentOutlined style={{ color: '#f56a00', marginRight: 4 }} />
                      <Text type="secondary">De: </Text>
                      <Text>{item.localOrigem?.nome_local || 'N/A'}</Text>
                      {item.localOrigem?.setor && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({item.localOrigem.setor.nome_setor})
                        </Text>
                      )}
                    </div>

                    <div style={{ marginBottom: 4 }}>
                      <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                      <Text type="secondary">Para: </Text>
                      <Text>{item.localDestino?.nome_local || 'N/A'}</Text>
                      {item.localDestino?.setor && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({item.localDestino.setor.nome_setor})
                        </Text>
                      )}
                    </div>

                    {item.usuarioResponsavel && (
                      <div style={{ marginBottom: 4 }}>
                        <UserOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                        <Text type="secondary">Responsável: </Text>
                        <Text>{item.usuarioResponsavel.nome}</Text>
                      </div>
                    )}

                    {(item.estado_conservacao_origem || item.estado_conservacao_destino) && (
                      <div>
                        <Text type="secondary">Estados de conservação: </Text>
                        {item.estado_conservacao_origem && (
                          <Tag color="orange">Origem: {item.estado_conservacao_origem}</Tag>
                        )}
                        {item.estado_conservacao_destino && (
                          <Tag color="green">Destino: {item.estado_conservacao_destino}</Tag>
                        )}
                      </div>
                    )}

                    {item.observacoes && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Observações: </Text>
                        <Text italic>{item.observacoes}</Text>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Nenhuma transferência encontrada" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};

export default HistoricoTransferencias;
