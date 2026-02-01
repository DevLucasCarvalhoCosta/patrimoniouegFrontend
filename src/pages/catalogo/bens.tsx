import type { Bem } from '@/interface/entities';
import type { FC } from 'react';
import { AppstoreOutlined, BarsOutlined, EnvironmentOutlined, TagOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Image, Input, List, Popover, Radio, Select, Space, Tag, Tooltip, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { apiListBens } from '@/api/public.api';
import TransferenciaModal from '@/components/business/transferencia/TransferenciaModal';
import { buildAssetUrl } from '@/config/api';
import { useBensRefreshListener } from '@/hooks/useBensRefresh';
import ExportButtons from '@/components/common/ExportButtons';
import dayjs from 'dayjs';

const CatalogoBens: FC = () => {
  const [bens, setBens] = useState<Bem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<any>({
    status: undefined as undefined | 'ativo' | 'baixado',
    periodo: undefined as undefined | [dayjs.Dayjs, dayjs.Dayjs],
    categoria: undefined as number | undefined,
    local: undefined as number | undefined,
    setor: undefined as number | undefined,
  });
  // estado de rascunho para o Popover de filtros; só aplicamos em "Aplicar"
  const [filtersDraft, setFiltersDraft] = useState<any>({
    status: undefined as undefined | 'ativo' | 'baixado',
    periodo: undefined as undefined | [dayjs.Dayjs, dayjs.Dayjs],
    categoria: undefined as number | undefined,
    local: undefined as number | undefined,
    setor: undefined as number | undefined,
  });
  const [viewMode, setViewMode] = useState<'card' | 'list'>(
    () => (localStorage.getItem('bensViewMode') as 'card' | 'list') || 'card',
  );
  const [pageCard, setPageCard] = useState<{ current: number; pageSize: number }>(() => {
    const ps = Number(localStorage.getItem('bensPageSizeCard') || '12');
    return { current: 1, pageSize: Number.isNaN(ps) || ps <= 0 ? 12 : ps };
  });
  const [pageList, setPageList] = useState<{ current: number; pageSize: number }>(() => {
    const ps = Number(localStorage.getItem('bensPageSizeList') || '10');
    return { current: 1, pageSize: Number.isNaN(ps) || ps <= 0 ? 10 : ps };
  });
  const location = useLocation();
  const navigate = useNavigate();
  // Estados para modal de transferência
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [bemParaTransferencia, setBemParaTransferencia] = useState<Bem | null>(null);

  // Dados do usuário
  const { userProfile } = useSelector((state: any) => state.user);
  const isAdmin = userProfile?.perfil === 'admin';

  const load = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiListBens();

      if (status) setBens(result as Bem[]);
    } finally {
      setLoading(false);
    }
  };

  // Escutar notificações para atualizar os bens
  useBensRefreshListener(load);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bensViewMode', viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('bensPageSizeCard', String(pageCard.pageSize));
      localStorage.setItem('bensPageSizeList', String(pageList.pageSize));
    } catch {}
  }, [pageCard.pageSize, pageList.pageSize]);

  // Função para tratar duplo clique no bem
  const handleBemDoubleClick = (bem: Bem) => {
    if (isAdmin) {
      setBemParaTransferencia(bem);
      setTransferenciaModalOpen(true);
    } else {
      message.warning('Você não tem permissão para executar transferências');
    }
  };

  const handleTransferenciaSuccess = () => {
    setTransferenciaModalOpen(false);
    setBemParaTransferencia(null);
    load(); // Recarregar dados após transferência
  };

  const handleTransferenciaCancel = () => {
    setTransferenciaModalOpen(false);
    setBemParaTransferencia(null);
  };

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const filtroCategoria = params.get('categoria');
  const filtroLocal = params.get('local');

  // Sincronizar query params com filtros (categoria/local)
  useEffect(() => {
    setFilters((f: any) => ({
      ...f,
      categoria: filtroCategoria ? Number(filtroCategoria) : f.categoria,
      local: filtroLocal ? Number(filtroLocal) : f.local,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCategoria, filtroLocal]);

  // Opções de filtros derivadas dos próprios bens
  const categoriaOptions = useMemo(() => {
    const map = new Map<number, string>();
    bens.forEach((b: any) => {
      const code = b.cod_categoria ?? b?.categoria?.cod_categoria;
      const name = b?.categoria?.nome_categoria;
      if (code != null && name) map.set(Number(code), String(name));
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [bens]);

  const localOptions = useMemo(() => {
    const map = new Map<number, string>();
    bens.forEach((b: any) => {
      const code = b.cod_local ?? b?.local?.cod_local;
      const name = b?.local?.nome_local;
      if (code != null && name) map.set(Number(code), String(name));
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [bens]);

  const setorOptions = useMemo(() => {
    const map = new Map<number, string>();
    bens.forEach((b: any) => {
      const code = b?.local?.setor?.cod_setor;
      const name = b?.local?.setor?.nome_setor || (code != null ? `Setor ${code}` : undefined);
      if (code != null && name) map.set(Number(code), String(name));
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [bens]);

  const filtered = useMemo(() => {
    let arr = bens || [];

    // status
    if (filters.status) arr = arr.filter((b: any) => String(b.status).toLowerCase() === String(filters.status));

    // período (usar data_criacao)
    if (filters.periodo && Array.isArray(filters.periodo)) {
      const [start, end] = filters.periodo;
      const startStr = start?.format('YYYY-MM-DD');
      const endStr = end?.format('YYYY-MM-DD');
      if (startStr || endStr) {
        arr = arr.filter((b: any) => {
          const da: string | undefined = b?.data_criacao;
          if (!da) return false;
          if (startStr && endStr) return da >= startStr && da <= endStr;
          if (startStr) return da >= startStr;
          if (endStr) return da <= endStr;
          return true;
        });
      }
    }

    // categoria/local/setor (considerar também params na URL)
    const cat = filters.categoria ?? (filtroCategoria ? Number(filtroCategoria) : undefined);
    const loc = filters.local ?? (filtroLocal ? Number(filtroLocal) : undefined);
    if (cat) arr = arr.filter((b: any) => Number(b.cod_categoria ?? b?.categoria?.cod_categoria) === Number(cat));
    if (loc) arr = arr.filter((b: any) => Number(b.cod_local ?? b?.local?.cod_local) === Number(loc));
    if (filters.setor)
      arr = arr.filter((b: any) => Number(b?.local?.setor?.cod_setor) === Number(filters.setor));

    // busca texto
    const query = q.trim().toLowerCase();
    if (query) {
      arr = arr.filter((r: any) => {
        const tokens = [
          r.numero_patrimonio,
          r.nome_bem,
          r?.categoria?.nome_categoria,
          r?.local?.nome_local,
          r.status,
        ]
          .filter(Boolean)
          .map((x: any) => String(x).toLowerCase());
        const codigoStrings = [
          r.cod_bem,
          r.cod_categoria || r?.categoria?.cod_categoria,
          r.cod_local || r?.local?.cod_local,
          r?.local?.setor?.cod_setor,
        ]
          .filter((x) => x !== undefined && x !== null)
          .map((x: any) => String(x));
        return tokens.some((t: string) => t.includes(query)) || codigoStrings.some((t: string) => t.includes(query));
      });
    }

    return arr;
  }, [bens, filters, q, filtroCategoria, filtroLocal]);

  // reset page to 1 on any filter/search/view change
  useEffect(() => {
    if (viewMode === 'card') setPageCard(p => ({ ...p, current: 1 }));
    else setPageList(p => ({ ...p, current: 1 }));
  }, [q, filtroCategoria, filtroLocal, viewMode, filters.status, filters.periodo, filters.categoria, filters.local, filters.setor]);

  const clearFilters = () => {
    // limpar query params e filtros aplicados
    navigate('/catalogo/bens');
    setFilters({ status: undefined, periodo: undefined, categoria: undefined, local: undefined, setor: undefined });
    setFiltersDraft({ status: undefined, periodo: undefined, categoria: undefined, local: undefined, setor: undefined });
  };

  const { Text } = Typography;
  // Valores efetivamente aplicados (estado aplicado ou query param)
  const appliedCategoria = useMemo(() => filters.categoria ?? (filtroCategoria ? Number(filtroCategoria) : undefined), [filters.categoria, filtroCategoria]);
  const appliedLocal = useMemo(() => filters.local ?? (filtroLocal ? Number(filtroLocal) : undefined), [filters.local, filtroLocal]);

  const formatMoney = (v?: string | number | null) => {
    if (v === undefined || v === null || v === '') return undefined;
    const num = typeof v === 'string' ? Number(v) : v;

    if (Number.isNaN(num)) return undefined;

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return undefined;
    // Expecting ISO or YYYY-MM-DD
    const date = new Date(d);

    if (Number.isNaN(date.getTime())) return undefined;

    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const goFilterCategoria = (cod?: number) => cod && navigate(`/catalogo/bens?categoria=${cod}`);
  const goFilterLocal = (cod?: number) => cod && navigate(`/catalogo/bens?local=${cod}`);

  return (
    <Card
      title={
        <Space size={8} wrap>
          <span>Catálogo de Bens</span>
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
          {/* Tags de filtros aplicados (evita duplicar com os params da URL) */}
          {filters.status ? (
            <Tag color={filters.status === 'ativo' ? 'green' : 'orange'}>Status: {filters.status}</Tag>
          ) : null}
          {filters.periodo?.[0] || filters.periodo?.[1] ? (
            <Tag color="gold">
              Período: {filters.periodo?.[0]?.format('YYYY-MM-DD') || '...'} a {filters.periodo?.[1]?.format('YYYY-MM-DD') || '...'}
            </Tag>
          ) : null}
          {appliedCategoria ? <Tag color="blue">Categoria: {appliedCategoria}</Tag> : null}
          {appliedLocal ? <Tag color="geekblue">Local: {appliedLocal}</Tag> : null}
          {filters.setor ? <Tag color="purple">Setor: {filters.setor}</Tag> : null}
          {appliedCategoria || appliedLocal || filters.status || filters.periodo || filters.setor ? (
            <Tag color="default" style={{ cursor: 'pointer' }} onClick={clearFilters}>
              Limpar filtros
            </Tag>
          ) : null}
        </Space>
      }
      extra={
        <Space size={8} wrap>
          <Popover
            placement="bottomLeft"
            open={filtersOpen}
            onOpenChange={(open) => {
              setFiltersOpen(open);
              if (open) {
                // ao abrir, sincroniza o rascunho com os filtros aplicados atuais
                setFiltersDraft({ ...filters });
              }
            }}
            trigger="click"
            content={
              <div style={{ width: 360 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Status</div>
                    <Space>
                      <Button
                        type={!filtersDraft.status ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setFiltersDraft((f: any) => ({ ...f, status: undefined }))}
                      >
                        Todos
                      </Button>
                      <Button
                        type={filtersDraft.status === 'ativo' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setFiltersDraft((f: any) => ({ ...f, status: 'ativo' }))}
                      >
                        Ativos
                      </Button>
                      <Button
                        type={filtersDraft.status === 'baixado' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setFiltersDraft((f: any) => ({ ...f, status: 'baixado' }))}
                      >
                        Baixados
                      </Button>
                    </Space>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Período de Criação</div>
                    <Space style={{ width: '100%' }} size={12}>
                      <DatePicker
                        placeholder="Data inicial"
                        style={{ width: 170 }}
                        value={filtersDraft.periodo?.[0] as any}
                        onChange={(val) =>
                          setFiltersDraft((f: any) => {
                            const end = f.periodo?.[1];
                            const next = val || end ? [val, end] : undefined;
                            return { ...f, periodo: next };
                          })
                        }
                        format="YYYY-MM-DD"
                      />
                      <DatePicker
                        placeholder="Data final"
                        style={{ width: 170 }}
                        value={filtersDraft.periodo?.[1] as any}
                        onChange={(val) =>
                          setFiltersDraft((f: any) => {
                            const start = f.periodo?.[0];
                            const next = start || val ? [start, val] : undefined;
                            return { ...f, periodo: next };
                          })
                        }
                        format="YYYY-MM-DD"
                      />
                    </Space>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Categoria</div>
                    <Select
                      allowClear
                      placeholder="Todas"
                      style={{ width: '100%' }}
                      value={filtersDraft.categoria}
                      onChange={(val) => setFiltersDraft((f: any) => ({ ...f, categoria: val }))}
                      options={categoriaOptions}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Local</div>
                    <Select
                      allowClear
                      placeholder="Todos"
                      style={{ width: '100%' }}
                      value={filtersDraft.local}
                      onChange={(val) => setFiltersDraft((f: any) => ({ ...f, local: val }))}
                      options={localOptions}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Setor</div>
                    <Select
                      allowClear
                      placeholder="Todos"
                      style={{ width: '100%' }}
                      value={filtersDraft.setor}
                      onChange={(val) => setFiltersDraft((f: any) => ({ ...f, setor: val }))}
                      options={setorOptions}
                    />
                  </div>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button onClick={() => setFiltersDraft({ status: undefined, periodo: undefined, categoria: undefined, local: undefined, setor: undefined })}>
                      Limpar filtros
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        setFilters({ ...filtersDraft });
                        setFiltersOpen(false);
                      }}
                    >
                      Aplicar
                    </Button>
                  </Space>
                </Space>
              </div>
            }
          >
            <Button icon={<FilterOutlined />}>Filtros</Button>
          </Popover>
          <Input.Search allowClear placeholder="Buscar por patrimônio, nome, categoria, local ou status" onSearch={setQ} style={{ width: 260 }} />
          <ExportButtons
            columns={[
              { title: 'Código do Bem', dataIndex: 'cod_bem' } as any,
              { title: 'Nº Patrimônio', dataIndex: 'numero_patrimonio' } as any,
              { title: 'Nome do Bem', dataIndex: 'nome_bem' } as any,
              { title: 'Categoria', dataIndex: ['categoria', 'nome_categoria'] } as any,
              { title: 'Local', dataIndex: ['local', 'nome_local'] } as any,
              { title: 'Setor', dataIndex: ['local', 'setor', 'nome_setor'] } as any,
              { title: 'Status', dataIndex: 'status' } as any,
              { title: 'Estado de Conservação', dataIndex: 'estado_conservacao' } as any,
              { title: 'Valor de Aquisição', dataIndex: 'valor_aquisicao' } as any,
              { title: 'Valor Atual', dataIndex: 'valor_atual' } as any,
              { title: 'Data de Aquisição', dataIndex: 'data_aquisicao' } as any,
              { title: 'Data de Criação', dataIndex: 'data_criacao' } as any,
            ]}
            data={filtered}
            filename={`bens-${new Date().toISOString().slice(0,10)}`}
            title="Catálogo de Bens"
            subtitle={(() => {
              const parts: string[] = [];
              if (q) parts.push(`Busca: ${q}`);
              if (filters.status) parts.push(`Status: ${filters.status}`);
              if (filters.periodo?.[0] || filters.periodo?.[1]) {
                const s = filters.periodo?.[0]?.format('YYYY-MM-DD');
                const e = filters.periodo?.[1]?.format('YYYY-MM-DD');
                parts.push(`Período: ${s || '...'} a ${e || '...'}`);
              }
              if (filters.categoria) parts.push(`Categoria: ${filters.categoria}`);
              if (filters.local) parts.push(`Local: ${filters.local}`);
              if (filters.setor) parts.push(`Setor: ${filters.setor}`);
              return parts.join(' | ') || undefined;
            })()}
            reportHeader={{
              sistema: 'Sistema de Patrimonio',
              titulo: 'RELATÓRIO BEM PERMANENTE',
              orgao: 'UNIVERSIDADE ESTADUAL DE GOIÁS - UEG',
              unidadeAdm: 'Trindade - GO',
              situacaoBem: filters.status ? String(filters.status).toUpperCase() : 'TODOS',
              exercicio: dayjs().format('YYYY/M'),
              dataEmissao: new Date().toLocaleString('pt-BR'),
              logoUrl: '/ueghorizontal.PNG'
            }}
          />
        </Space>
      }
    >
      {viewMode === 'card' ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
          dataSource={filtered}
          loading={loading}
          pagination={{
            current: pageCard.current,
            pageSize: pageCard.pageSize,
            total: filtered.length,
            onChange: (page, size) => setPageCard({ current: page, pageSize: size || pageCard.pageSize }),
            showQuickJumper: true,
            showSizeChanger: true,
            pageSizeOptions: ['8', '12', '16', '24'],
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
          }}
          renderItem={item => (
            <List.Item>
              <Card
                hoverable
                onDoubleClick={() => handleBemDoubleClick(item)}
                style={{ height: 320, display: 'flex', flexDirection: 'column' }}
                bodyStyle={{
                  padding: 12,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                }}
                cover={(() => {
                  const cat = item.categoria;
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

                  return (
                    <div>
                      <div style={{ padding: '8px 12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <Text type="secondary">
                          Nº Patrimônio: <Text strong>{item.numero_patrimonio}</Text>
                        </Text>
                      </div>
                      <div
                        style={{
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: first ? '#fff' : '#f5f5f5',
                          overflow: 'hidden',
                        }}
                      >
                        {first ? (
                          <img
                            src={buildAssetUrl(first)}
                            alt={item.categoria?.nome_categoria ? `Imagem da categoria ${item.categoria?.nome_categoria}` : 'Imagem da categoria'}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              display: 'block',
                              width: 'auto',
                              height: 'auto',
                            }}
                          />
                        ) : (
                          <div style={{ color: '#999' }}>Sem imagem</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Nome do bem - altura fixa */}
                  <div style={{ height: '48px', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Tag color={item.status === 'ativo' ? 'green' : 'orange'} style={{ marginRight: 8, flexShrink: 0 }}>
                      {item.status}
                    </Tag>
                    <Typography.Text
                      strong
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                      ellipsis={{ tooltip: item.nome_bem }}
                    >
                      {item.nome_bem}
                    </Typography.Text>
                  </div>

                  {/* Categoria - altura fixa */}
                  <div style={{ height: '24px', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <TagOutlined style={{ marginRight: 6, color: '#1677ff', fontSize: '12px' }} />
                    <Text
                      strong
                      underline
                      style={{ cursor: 'pointer', fontSize: '12px' }}
                      onClick={() => goFilterCategoria(item.cod_categoria)}
                      ellipsis={{ tooltip: item.categoria?.nome_categoria }}
                    >
                      {item.categoria?.nome_categoria || 'Sem categoria'}
                    </Text>
                  </div>

                  {/* Local - altura fixa */}
                  <div style={{ height: '24px', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <EnvironmentOutlined style={{ marginRight: 6, color: '#fa541c', fontSize: '12px' }} />
                    <Text
                      strong
                      underline
                      style={{ cursor: 'pointer', fontSize: '12px' }}
                      onClick={() => goFilterLocal(item.cod_local)}
                      ellipsis={{ tooltip: item.local?.nome_local }}
                    >
                      {item.local?.nome_local || 'Local não definido'}
                    </Text>
                  </div>

                  {/* Estado de conservação - altura fixa */}
                  <div style={{ height: '24px', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Conservação: <Text strong>{item.estado_conservacao || 'Não informado'}</Text>
                    </Text>
                  </div>

                  <div style={{ height: '24px', display: 'flex', alignItems: 'center', marginTop: 'auto', gap: 12 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Aquisição: <Text strong>{formatMoney(item.valor_aquisicao) || 'Não informado'}</Text>
                    </Text>
                    {item.valor_atual != null && item.valor_atual !== undefined ? (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Atual: <Text strong>{formatMoney(item.valor_atual)}</Text>
                      </Text>
                    ) : null}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <List
          dataSource={filtered}
          loading={loading}
          itemLayout="horizontal"
          pagination={{
            current: pageList.current,
            pageSize: pageList.pageSize,
            total: filtered.length,
            onChange: (page, size) => setPageList({ current: page, pageSize: size || pageList.pageSize }),
            showQuickJumper: true,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '30', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}`,
          }}
          renderItem={item => (
            <List.Item onDoubleClick={() => handleBemDoubleClick(item)} style={{ cursor: 'pointer' }}>
              <List.Item.Meta
                avatar={(() => {
                  const cat = item.categoria;
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

                  return (
                    <div style={{ width: 120 }}>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                        Nº Patrimônio: <Text strong>{item.numero_patrimonio}</Text>
                      </Text>
                      {first ? (
                        <Image
                          src={buildAssetUrl(first)}
                          width={120}
                          height={90}
                          style={{ objectFit: 'contain', borderRadius: 4 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 120,
                            height: 90,
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            borderRadius: 4,
                          }}
                        >
                          Sem imagem
                        </div>
                      )}
                    </div>
                  );
                })()}
                title={
                  <Space size={8} wrap>
                    <Tag color={item.status === 'ativo' ? 'green' : 'orange'} style={{ marginRight: 4 }}>
                      {item.status}
                    </Tag>
                    <span>{item.nome_bem}</span>
                  </Space>
                }
                description={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
                      {item.categoria?.nome_categoria ? (
                        <Text type="secondary">
                          <TagOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                          <Text
                            strong
                            underline
                            style={{ cursor: 'pointer' }}
                            onClick={() => goFilterCategoria(item.cod_categoria)}
                          >
                            {item.categoria?.nome_categoria}
                          </Text>
                        </Text>
                      ) : null}
                      {item.local?.nome_local ? (
                        <Text type="secondary">
                          <EnvironmentOutlined style={{ marginRight: 6, color: '#fa541c' }} />
                          <Text
                            strong
                            underline
                            style={{ cursor: 'pointer' }}
                            onClick={() => goFilterLocal(item.cod_local)}
                          >
                            {item.local?.nome_local}
                          </Text>
                        </Text>
                      ) : null}
                    </div>
                    {item.marca || item.modelo ? (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {item.marca ? (
                          <Text type="secondary">
                            Marca: <Text strong>{item.marca}</Text>
                          </Text>
                        ) : null}
                        {item.modelo ? (
                          <Text type="secondary">
                            Modelo: <Text strong>{item.modelo}</Text>
                          </Text>
                        ) : null}
                      </div>
                    ) : null}
                    {item.estado_conservacao ? (
                      <div>
                        <Text type="secondary">
                          Conservação: <Text strong>{item.estado_conservacao}</Text>
                        </Text>
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {formatMoney(item.valor_aquisicao) ? (
                        <Text type="secondary">
                          Aquisição: <Text strong>{formatMoney(item.valor_aquisicao)}</Text>
                        </Text>
                      ) : null}
                      {item.valor_atual != null && item.valor_atual !== undefined ? (
                        <Text type="secondary">
                          Atual: <Text strong>{formatMoney(item.valor_atual)}</Text>
                        </Text>
                      ) : null}
                      {formatDate(item.data_aquisicao) ? (
                        <Text type="secondary">
                          Aquisição: <Text strong>{formatDate(item.data_aquisicao)}</Text>
                        </Text>
                      ) : null}
                    </div>
                  </div>
                }
              />
              <div>{/* espaço reservado para ações futuras */}</div>
            </List.Item>
          )}
        />
      )}

      {/* Modal de Transferência */}
      {transferenciaModalOpen && bemParaTransferencia && (
        <TransferenciaModal
          open={transferenciaModalOpen}
          onCancel={() => {
            setTransferenciaModalOpen(false);
            setBemParaTransferencia(null);
          }}
          bem={bemParaTransferencia}
          onSuccess={() => {
            setTransferenciaModalOpen(false);
            setBemParaTransferencia(null);
            message.success('Transferência realizada com sucesso!');
            // Recarregar os dados dos bens para refletir a mudança de local
            load();
          }}
        />
      )}
    </Card>
  );
};

export default CatalogoBens;
