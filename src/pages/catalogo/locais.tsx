import type { Local } from '@/interface/entities';
import type { FC } from 'react';

import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { Card, List, Radio, Space, theme as antTheme, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiListLocais } from '@/api/public.api';
import ExportButtons from '@/components/common/ExportButtons';

import { makeCatalogUI } from './styles';

const CatalogoLocais: FC = () => {
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(
    () => (localStorage.getItem('locaisViewMode') as 'card' | 'list') || 'card',
  );

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const { status, result } = await apiListLocais();

        if (status) setLocais(result as Local[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('locaisViewMode', viewMode);
    } catch {}
  }, [viewMode]);

  const { token } = antTheme.useToken();
  const { Section, ListItem, CardBox, Header, Title, Body, Subtle } = makeCatalogUI(token);
  const navigate = useNavigate();

  return (
    <Section>
      <Card
        title={
          <Space size={8} wrap>
            <span>Locais</span>
            <ExportButtons
              columns={[
                { title: 'Código', dataIndex: 'cod_local' } as any,
                { title: 'Nome', dataIndex: 'nome_local' } as any,
                { title: 'Setor', dataIndex: 'cod_setor' } as any,
              ]}
              data={locais}
              filename={`catalogo-locais-${new Date().toISOString().slice(0,10)}`}
              title="Catálogo de Locais"
            />
            <Radio.Group
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Tooltip title="Cards">
                <Radio.Button value="card">
                  <AppstoreOutlined />
                </Radio.Button>
              </Tooltip>
              <Tooltip title="Lista">
                <Radio.Button value="list">
                  <BarsOutlined />
                </Radio.Button>
              </Tooltip>
            </Radio.Group>
          </Space>
        }
      >
        {viewMode === 'card' ? (
          <List
            grid={{ gutter: 20, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5 }}
            dataSource={locais}
            loading={loading}
            renderItem={(l: Local) => (
              <List.Item>
                <ListItem>
                  <CardBox
                    onClick={() => navigate(`/catalogo/bens?local=${l.cod_local}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Header>
                      <Title>{l.nome_local}</Title>
                    </Header>
                    <Body>
                      <Subtle>Código: {l.cod_local}</Subtle>
                      <div>Setor: {l.cod_setor}</div>
                    </Body>
                  </CardBox>
                </ListItem>
              </List.Item>
            )}
          />
        ) : (
          <List
            dataSource={locais}
            loading={loading}
            itemLayout="horizontal"
            renderItem={(l: Local) => (
              <List.Item onClick={() => navigate(`/catalogo/bens?local=${l.cod_local}`)} style={{ cursor: 'pointer' }}>
                <List.Item.Meta
                  title={<span>{l.nome_local}</span>}
                  description={
                    <div>
                      <div>Código: {l.cod_local}</div>
                      <div>Setor: {l.cod_setor}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </Section>
  );
};

export default CatalogoLocais;
