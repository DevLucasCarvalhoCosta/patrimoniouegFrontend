import type { Categoria } from '@/interface/entities';
import type { FC } from 'react';

import { AppstoreOutlined, BarsOutlined, PictureOutlined } from '@ant-design/icons';
import { Card, List, Radio, Space, Tag, theme as antTheme, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiListCategorias } from '@/api/public.api';
import ExportButtons from '@/components/common/ExportButtons';
import { buildAssetUrl } from '@/config/api';

import { makeCatalogUI } from './styles';

const CatalogoCategorias: FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(
    () => (localStorage.getItem('categoriasViewMode') as 'card' | 'list') || 'card',
  );

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const { status, result } = await apiListCategorias();

        if (status) setCategorias(result as Categoria[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('categoriasViewMode', viewMode);
    } catch {}
  }, [viewMode]);

  const { token } = antTheme.useToken();
  const { Section, ListItem, CardBox, Header, Title, Extra, Body, Subtle, Clamp2, Cover, Thumbs, Description } = makeCatalogUI(token);
  const navigate = useNavigate();

  return (
    <Section>
      <Card
        title={
          <Space size={8} wrap>
            <span>Categorias</span>
            <ExportButtons
              columns={[
                { title: 'Código', dataIndex: 'cod_categoria' } as any,
                { title: 'Nome', dataIndex: 'nome_categoria' } as any,
                { title: 'Ativa', dataIndex: 'ativo' } as any,
              ]}
              data={categorias}
              filename={`catalogo-categorias-${new Date().toISOString().slice(0,10)}`}
              title="Catálogo de Categorias"
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
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
            dataSource={categorias}
            loading={loading}
            renderItem={(c: Categoria) => (
              <List.Item>
                <ListItem>
                  <CardBox
                    onClick={() => navigate(`/catalogo/bens?categoria=${c.cod_categoria}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {(() => {
                      // Escolhe a primeira imagem disponível da categoria para servir como capa do card
                      const srcs = [
                        c.imagem1,
                        c.imagem2,
                        c.imagem3,
                        c.imagem4,
                        c.imagem5,
                        c.imagem6,
                        c.imagem7,
                        c.imagem8,
                        c.imagem9,
                        c.imagem10,
                      ]
                        .map(s => (s && String(s).trim() ? String(s) : ''))
                        .filter(Boolean) as string[];
                      const first = srcs[0];
                      // Miniaturas opcionais são renderizadas no Body; aqui apenas exibimos a capa
                      const thumbs = srcs.slice(0, 3);
                      return (
                        <Cover>
                          {first ? (
                            <img src={buildAssetUrl(first)} alt={`Imagem da categoria ${c.nome_categoria}`} />
                          ) : (
                            <div style={{ color: '#999', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <PictureOutlined /> Sem imagem
                            </div>
                          )}
                        </Cover>
                      );
                    })()}
                    <Header>
                      <Title>{c.nome_categoria}</Title>
                      <Extra>
                        <Tag color={c.ativo ? 'blue' : 'default'}>{c.ativo ? 'Ativa' : 'Inativa'}</Tag>
                      </Extra>
                    </Header>
                    <Body>
                      <Subtle>Código: {c.cod_categoria}</Subtle>
                      {c.descricao ? <Description>{c.descricao}</Description> : null}
                      {(() => {
                        // Renderiza até 3 miniaturas para dar contexto visual rápido
                        const srcs = [
                          c.imagem1,
                          c.imagem2,
                          c.imagem3,
                          c.imagem4,
                          c.imagem5,
                          c.imagem6,
                          c.imagem7,
                          c.imagem8,
                          c.imagem9,
                          c.imagem10,
                        ]
                          .map(s => (s && String(s).trim() ? String(s) : ''))
                          .filter(Boolean) as string[];
                        const thumbs = srcs.slice(0, 3);
                        if (!thumbs.length) return null;
                        return (
                          <Thumbs>
                            {thumbs.map((s, idx) => (
                              <img key={idx} src={buildAssetUrl(s)} alt={`Thumb ${idx + 1} - ${c.nome_categoria}`} />
                            ))}
                          </Thumbs>
                        );
                      })()}
                    </Body>
                  </CardBox>
                </ListItem>
              </List.Item>
            )}
          />
        ) : (
          <List
            dataSource={categorias}
            loading={loading}
            itemLayout="horizontal"
            renderItem={(c: Categoria) => (
              <List.Item
                onClick={() => navigate(`/catalogo/bens?categoria=${c.cod_categoria}`)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {c.nome_categoria}{' '}
                      <Tag color={c.ativo ? 'blue' : 'default'} style={{ marginLeft: 8 }}>
                        {c.ativo ? 'Ativa' : 'Inativa'}
                      </Tag>
                    </span>
                  }
                  description={
                    <div>
                      <div>Código: {c.cod_categoria}</div>
                      {c.descricao ? (
                        <div style={{ color: '#999', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.descricao}</div>
                      ) : null}
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

export default CatalogoCategorias;
