import type { Transferencia } from '@/interface/entities';
import type { FC } from 'react';

import { EnvironmentOutlined, HistoryOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Card, Empty, List, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGetTransferenciasRecentes } from '@/api/transferencias.api';

const { Text } = Typography;

const TransferenciasRecentesDashboard: FC = () => {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTransferenciasRecentes();
  }, []);

  const loadTransferenciasRecentes = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiGetTransferenciasRecentes(8); // Últimas 8 para preencher melhor o espaço

      if (status && result) {
        // O backend retorna um array direto
        const transferenciasArray = Array.isArray(result) ? result : [];

        setTransferencias(transferenciasArray);
      }
    } catch (error) {
      // Erro silencioso para evitar problemas no console
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          Transferências Recentes
        </Space>
      }
      loading={loading}
      size="small"
      style={{ height: '400px', width: '100%' }}
      bodyStyle={{ height: '320px', padding: '12px', overflowX: 'hidden' }}
      extra={
        <Button type="link" size="small" onClick={() => navigate('/transferencias')}>
          Ver todas
        </Button>
      }
    >
      {transferencias.length > 0 ? (
        <List
          size="small"
          style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
          dataSource={transferencias}
          renderItem={item => {
            if (!item) return null;

            return (
              <List.Item
                key={String(item.cod_transferencia ?? item.cod_bem ?? Math.random())}
                style={{ padding: '12px 0' }}
              >
                <List.Item.Meta
                  avatar={<HistoryOutlined style={{ color: '#1890ff' }} />}
                  title={
                    <div>
                      <Text strong style={{ fontSize: '13px' }}>
                        {item?.bem?.nome_bem || 'Bem N/A'}
                      </Text>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {item?.data_transferencia ? dayjs(item.data_transferencia).format('DD/MM/YYYY HH:mm') : '-'}
                      </div>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <EnvironmentOutlined style={{ color: '#f56a00', marginRight: 4 }} />
                        <Text type="secondary">{item.localOrigem?.nome_local || 'N/A'}</Text>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                        <Text type="secondary">{item.localDestino?.nome_local || 'N/A'}</Text>
                      </div>
                      {item?.usuarioResponsavel && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            Responsável: {item.usuarioResponsavel.nome}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="Nenhuma transferência recente" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )}
    </Card>
  );
};

export default TransferenciasRecentesDashboard;
