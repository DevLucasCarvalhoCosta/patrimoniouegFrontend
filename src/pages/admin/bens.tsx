import type { Bem } from '@/interface/entities';
import type { FC } from 'react';

import { PlusOutlined, SwapOutlined, FilterOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Popover,
  Checkbox,
  Space,
  Table,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';

import { apiCreateBemTangivel, apiDeleteBem, apiDeleteBemCascade, apiExcluirTodosBens, apiBaixarBem, apiUpdateBem } from '@/api/bens.api';
import { apiListBens as apiPublicListBens } from '@/api/public.api';
import { apiListCategoriasProtected } from '@/api/categorias.api';
import { apiListLocaisProtected } from '@/api/locais.api';
import { apiListSetores } from '@/api/setores.api';
import TransferenciaModal from '@/components/business/transferencia/TransferenciaModal';
import { useBensRefreshListener } from '@/hooks/useBensRefresh';
import { addNotification } from '@/utils/notifications';
import ExportButtons from '@/components/common/ExportButtons';
import { useSelector } from 'react-redux';
import MySearch from '@/components/business/search';
import MyFormItem from '@/components/core/form-item';

const { Option } = Select;

const AdminBens: FC = () => {
  const { userProfile } = useSelector((state: any) => state.user);
  const [data, setData] = useState<Bem[]>([]);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<any>({
    status: undefined as undefined | 'ativo' | 'baixado',
    periodo: undefined as undefined | [dayjs.Dayjs, dayjs.Dayjs],
    categoria: undefined as number | undefined,
    local: undefined as number | undefined,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState<null | number>(null);
  const [editing, setEditing] = useState<Bem | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState({ categorias: false, locais: false, setores: false });
  const [form] = Form.useForm();

  // Estados para transferência
  const [transferenciaModalOpen, setTransferenciaModalOpen] = useState(false);
  const [bemParaTransferencia, setBemParaTransferencia] = useState<Bem | null>(null);

  const filteredData = useMemo(() => {
    let list = data || [];

    // Client-side filters
    if (filters.status) {
      list = list.filter((r: any) => String(r.status).toLowerCase() === String(filters.status));
    }

    if (filters.periodo && Array.isArray(filters.periodo)) {
      const [start, end] = filters.periodo;
      const startStr = start?.format('YYYY-MM-DD');
      const endStr = end?.format('YYYY-MM-DD');
      if (startStr || endStr) {
        list = list.filter((r: any) => {
          const da: string | undefined = r?.data_criacao;
          if (!da) return false;
          if (startStr && endStr) return da >= startStr && da <= endStr;
          if (startStr) return da >= startStr;
          if (endStr) return da <= endStr;
          return true;
        });
      }
    }

    if (filters.categoria) {
      list = list.filter((r: any) => {
        const code = r.cod_categoria ?? r?.categoria?.cod_categoria;
        return Number(code) === Number(filters.categoria);
      });
    }

    if (filters.local) {
      list = list.filter((r: any) => {
        const code = r.cod_local ?? r?.local?.cod_local;
        return Number(code) === Number(filters.local);
      });
    }

    if ((filters as any).setor) {
      list = list.filter((r: any) => {
        const code = r?.local?.setor?.cod_setor;
        return Number(code) === Number((filters as any).setor);
      });
    }

    // Text search
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((r: any) => {
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
        ]
          .filter((x) => x !== undefined && x !== null)
          .map((x: any) => String(x));
        return tokens.some((t: string) => t.includes(query)) || codigoStrings.some((t: string) => t.includes(query));
      });
    }

    return list;
  }, [data, q, filters.periodo, filters.categoria, filters.local]);

  const load = async () => {
    setLoading(true);

    try {
      // Buscar todos os bens do endpoint público e filtrar no cliente
      const resp = await apiPublicListBens();
      const { status, result } = resp as any;

      if (status) setData(result as Bem[]);
    } catch (e) {
      message.error('Falha ao carregar bens');
    } finally {
      setLoading(false);
    }
  };

  // Escutar notificações para atualizar os bens
  useBensRefreshListener(load);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load reference data (categorias, locais, setores)
  useEffect(() => {
    const loadRefs = async () => {
      setLoadingRefs({ categorias: true, locais: true, setores: true });

      try {
        const [cats, locs, sets] = await Promise.all([
          apiListCategoriasProtected(),
          apiListLocaisProtected(),
          apiListSetores(),
        ]);

        if (cats?.status) setCategorias(cats.result || []);
        if (locs?.status) setLocais(locs.result || []);
        if (sets?.status) setSetores(sets.result || []);
      } finally {
        setLoadingRefs({ categorias: false, locais: false, setores: false });
      }
    };

    loadRefs();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'cod_bem' },
    { title: 'N° Patrimonio', dataIndex: 'numero_patrimonio' },
    { title: 'Nome', dataIndex: 'nome_bem' },
    { title: 'Status', dataIndex: 'status' },
    {
      title: 'Categoria',
      dataIndex: ['categoria', 'nome_categoria'],
      render: (_: any, r: any) => r?.categoria?.nome_categoria || '-',
    },
    { title: 'Local', dataIndex: ['local', 'nome_local'], render: (_: any, r: any) => r?.local?.nome_local || '-' },
    // Imagens removidas do Bem; agora via categoria
    {
      title: 'Ações',
      render: (_: any, r: Bem) => (
        <>
          <Button
            size="small"
            onClick={() => {
              setEditing(r);
              setOpen(true);
              // map date string to dayjs and ensure selects bind to codes
              const { data_aquisicao, cod_local, cod_categoria, ...rest } = r as any;

              form.setFieldsValue({
                ...rest,
                cod_local,
                cod_categoria,
                data_aquisicao: data_aquisicao ? dayjs(data_aquisicao) : undefined,
                valor_aquisicao:
                  rest?.valor_aquisicao != null && rest?.valor_aquisicao !== ''
                    ? String(Number(rest.valor_aquisicao).toFixed(2))
                    : undefined,
                valor_atual:
                  (rest as any)?.valor_atual != null && (rest as any)?.valor_atual !== ''
                    ? String(Number((rest as any).valor_atual).toFixed(2))
                    : undefined,
              });
            }}
          >
            Editar
          </Button>
          <Button
            size="small"
            style={{ marginLeft: 8 }}
            onClick={() => {
              let obs = '';
              Modal.confirm({
                title: 'Dar baixa neste bem?',
                content: (
                  <div>
                    <p>Confirme a baixa. Opcionalmente informe o motivo/observações.</p>
                    <Input.TextArea rows={3} placeholder="Observações (opcional)" onChange={e => (obs = e.target.value)} />
                  </div>
                ),
                okText: 'Confirmar baixa',
                cancelText: 'Cancelar',
                async onOk() {
                  try {
                    await apiBaixarBem(r.cod_bem, obs ? { observacoes: obs } : undefined);
                    message.success('Bem baixado com sucesso');
                    addNotification({
                      title: 'Baixa de bem',
                      operation: 'update',
                      entity: 'bem',
                      entityId: r.cod_bem,
                      description: `Bem "${r.nome_bem}" foi baixado` + (obs ? ` (Obs: ${obs})` : ''),
                    });
                    load();
                  } catch (e: any) {
                    message.error(e?.response?.data?.erro || e?.response?.data?.message || 'Falha ao dar baixa');
                    return Promise.reject();
                  }
                },
              });
            }}
          >
            Dar baixa
          </Button>
          <Popconfirm
            title="Excluir bem?"
            okText="Excluir"
            cancelText="Cancelar"
            onConfirm={async () => {
              try {
                await apiDeleteBem(r.cod_bem); // 204 No Content
                message.success('Bem excluído definitivamente');
                addNotification({
                  title: 'Bem excluído',
                  operation: 'delete',
                  entity: 'bem',
                  entityId: r.cod_bem,
                  description: `Bem "${r.nome_bem}" (Patrimônio: ${r.numero_patrimonio}) foi excluído`,
                });
                load();
              } catch (e: any) {
                const status = e?.response?.status;
                const msg = e?.response?.data?.erro || e?.response?.data?.message;
                if (status === 400) {
                  Modal.confirm({
                    title: 'Bem possui transferências',
                    content: (
                      <div>
                        <p>{msg || 'Este bem possui dependências (transferências).'}</p>
                        <p>Deseja executar exclusão em cascata? Isso removerá o bem e suas transferências.</p>
                      </div>
                    ),
                    okText: 'Excluir em cascata',
                    cancelText: 'Cancelar',
                    async onOk() {
                      try {
                        const resp = await apiDeleteBemCascade(r.cod_bem);
                        message.success('Bem e transferências excluídos');
                        addNotification({
                          title: 'Exclusão em cascata',
                          operation: 'delete',
                          entity: 'bem',
                          entityId: r.cod_bem,
                          description: `Bem "${r.nome_bem}" e transferências relacionadas foram excluídos`,
                        });
                        load();
                      } catch (err: any) {
                        message.error(err?.response?.data?.erro || 'Falha na exclusão em cascata');
                        return Promise.reject();
                      }
                    },
                  });
                } else {
                  message.error(msg || 'Falha ao excluir bem');
                }
              }
            }}
          >
            <Button danger size="small" style={{ marginLeft: 8 }}>
              Excluir
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            size="small"
            icon={<SwapOutlined />}
            style={{ marginLeft: 8 }}
            onClick={() => {
              setBemParaTransferencia(r);
              setTransferenciaModalOpen(true);
            }}
          >
            Transferir
          </Button>
        </>
      ),
    },
  ];

  const onSave = async (values: any) => {
    try {
      const payload = {
        ...values,
        cod_local: Number(values.cod_local),
        cod_categoria: Number(values.cod_categoria),
        data_aquisicao: values.data_aquisicao ? (values.data_aquisicao as any).format('YYYY-MM-DD') : undefined,
        valor_aquisicao:
          values.valor_aquisicao != null && values.valor_aquisicao !== ''
            ? Number(values.valor_aquisicao).toFixed(2)
            : undefined,
        valor_atual:
          values.valor_atual != null && values.valor_atual !== ''
            ? Number(values.valor_atual).toFixed(2)
            : undefined,
      };

      if (editing) {
        const { status } = await apiUpdateBem(editing.cod_bem, payload);

        if (status) {
          message.success('Bem atualizado');
          addNotification({
            title: 'Bem atualizado',
            operation: 'update',
            entity: 'bem',
            entityId: editing.cod_bem,
            description: `Bem "${values.nome_bem}" (Patrimônio: ${values.numero_patrimonio}) foi atualizado`,
          });
        }
      } else {
        const { status, result } = await apiCreateBemTangivel(payload);

        if (status) {
          message.success('Bem criado');
          const createdId = (result && (result as any).cod_bem) || undefined;

          addNotification({
            title: 'Novo bem cadastrado',
            operation: 'create',
            entity: 'bem',
            entityId: createdId,
            description: `Bem "${values.nome_bem}" (Patrimônio: ${values.numero_patrimonio}) foi cadastrado com sucesso`,
          });
        }
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.erro || 'Erro ao salvar bem');
    }
  };

  return (
    <Card
      title="Bens (Admin)"
      extra={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Popover
            placement="bottomLeft"
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            trigger="click"
            content={
              <div style={{ width: 360 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {userProfile?.perfil === 'admin' && (
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Status</div>
                      <Space>
                        <Button
                          type={!filters.status ? 'primary' : 'default'}
                          size="small"
                          onClick={() => setFilters((f: any) => ({ ...f, status: undefined }))}
                        >
                          Todos
                        </Button>
                        <Button
                          type={filters.status === 'ativo' ? 'primary' : 'default'}
                          size="small"
                          onClick={() => setFilters((f: any) => ({ ...f, status: 'ativo' }))}
                        >
                          Ativos
                        </Button>
                        <Button
                          type={filters.status === 'baixado' ? 'primary' : 'default'}
                          size="small"
                          onClick={() => setFilters((f: any) => ({ ...f, status: 'baixado' }))}
                        >
                          Baixados
                        </Button>
                      </Space>
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Período de Criação</div>
                    <Space style={{ width: '100%' }} size={12}>
                      <DatePicker
                        placeholder="Data inicial"
                        style={{ width: 170 }}
                        value={filters.periodo?.[0] as any}
                        onChange={(val) =>
                          setFilters((f: any) => {
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
                        value={filters.periodo?.[1] as any}
                        onChange={(val) =>
                          setFilters((f: any) => {
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
                      loading={loadingRefs.categorias}
                      value={filters.categoria}
                      onChange={(val) => setFilters((f: any) => ({ ...f, categoria: val }))}
                      options={categorias.map(c => ({ value: c.cod_categoria, label: c.nome_categoria }))}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Local</div>
                    <Select
                      allowClear
                      placeholder="Todos"
                      style={{ width: '100%' }}
                      loading={loadingRefs.locais}
                      value={filters.local}
                      onChange={(val) => setFilters((f: any) => ({ ...f, local: val }))}
                      options={locais.map(l => ({ value: l.cod_local, label: l.nome_local }))}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Setor</div>
                    <Select
                      allowClear
                      placeholder="Todos"
                      style={{ width: '100%' }}
                      loading={loadingRefs.setores}
                      value={(filters as any).setor}
                      onChange={(val) => setFilters((f: any) => ({ ...f, setor: val }))}
                      options={setores.map(s => ({ value: s.cod_setor, label: s.nome_setor }))}
                    />
                  </div>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button
                      onClick={() => setFilters({ status: filters.status, periodo: undefined, categoria: undefined, local: undefined, setor: undefined } as any)}
                    >
                      Limpar filtros
                    </Button>
                    <Button type="primary" onClick={() => setFiltersOpen(false)}>Aplicar</Button>
                  </Space>
                </Space>
              </div>
            }
          >
            <Button icon={<FilterOutlined />}>Filtros</Button>
          </Popover>
          <Input.Search allowClear placeholder="Buscar por patrimônio, nome, categoria, local ou status" onSearch={setQ} style={{ width: 360 }} />
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
            ] as any}
            data={filteredData}
            filename={`bens-admin-${new Date().toISOString().slice(0,10)}`}
            title="Relatório de Bens (Admin)"
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
              if ((filters as any).setor) parts.push(`Setor: ${(filters as any).setor}`);
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            Novo Bem
          </Button>
          {userProfile?.perfil === 'admin' && (
            <Button
              danger
              type="default"
              onClick={async () => {
                Modal.confirm({
                  title: 'Excluir TODOS os bens ATIVOS?',
                  content:
                    'Esta ação é irreversível e excluirá permanentemente todos os bens com status ATIVO (e suas imagens). Para confirmar, digite: EXCLUIR_TODOS_OS_BENS',
                  okText: 'Continuar',
                  cancelText: 'Cancelar',
                  icon: null,
                  async onOk() {
                    const { value } = await new Promise<{ value: string | null }>(resolve => {
                      let inputVal = '';
                      const m = Modal.confirm({
                        title: 'Confirmação explícita',
                        content: (
                          <div>
                            <p>Digite exatamente: EXCLUIR_TODOS_OS_BENS</p>
                            <Input onChange={e => (inputVal = e.target.value)} placeholder="EXCLUIR_TODOS_OS_BENS" />
                          </div>
                        ),
                        okText: 'Confirmar',
                        cancelText: 'Cancelar',
                        onOk() {
                          resolve({ value: inputVal });
                        },
                        onCancel() {
                          resolve({ value: null });
                        },
                      });
                    });

                    if (value !== 'EXCLUIR_TODOS_OS_BENS') {
                      message.warning('Texto de confirmação inválido. Operação cancelada.');
                      return Promise.reject();
                    }

                    try {
                      const { status, result } = await apiExcluirTodosBens('EXCLUIR_TODOS_OS_BENS');

                      if (status) {
                        const stats: any = result || {};
                        message.success(
                          `Exclusão concluída. Total excluídos: ${stats.totalExcluidos || 0}. Com transferências: ${stats.totalComTransferencias || 0
                          }`,
                        );
                        addNotification({
                          title: 'Exclusão em massa de bens',
                          operation: 'delete',
                          entity: 'bem',
                          description: 'Todos os bens ATIVOS foram excluídos permanentemente pelo administrador.',
                        });
                        load();
                      }
                    } catch (e: any) {
                      message.error(e?.response?.data?.erro || 'Falha na exclusão em massa');
                    }

                    return Promise.resolve();
                  },
                });
              }}
            >
              Excluir todos
            </Button>
          )}
        </div>
      }
    >
  <Table
        rowKey="cod_bem"
        columns={columns as any}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] as any }}
      />
      <Modal
        title={editing ? 'Editar Bem' : 'Novo Bem'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={onSave} initialValues={{ movimentavel: true }}>
          <Form.Item label="Número do Patrimônio" name="numero_patrimonio" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Nome do Bem" name="nome_bem" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Marca" name="marca">
            <Input />
          </Form.Item>
          <Form.Item label="Modelo" name="modelo">
            <Input />
          </Form.Item>
          <Form.Item label="Número de Série" name="numero_serie">
            <Input />
          </Form.Item>
          <Form.Item label="Valor de Aquisição" name="valor_aquisicao">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              stringMode
              formatter={(value: any, info: any) => {
                if (info && info.userTyping) return value as any; // não mascara enquanto digita
                if (value === undefined || value === null || (value as unknown as string) === '') return '' as any;
                const raw = String(value);
                const s = raw.replace(/[^0-9,.-]/g, '');
                const lastComma = s.lastIndexOf(',');
                const lastDot = s.lastIndexOf('.');
                const lastSep = Math.max(lastComma, lastDot);
                let normalized: string;

                if (lastSep === -1) {
                  normalized = s.replace(/[^0-9-]/g, '');
                } else {
                  const intPart = s.slice(0, lastSep).replace(/[^0-9-]/g, '');
                  const decPart = s
                    .slice(lastSep + 1)
                    .replace(/[^0-9]/g, '')
                    .slice(0, 2);

                  normalized = decPart.length ? `${intPart}.${decPart}` : intPart;
                }

                const num = Number(normalized);

                if (Number.isNaN(num)) return raw;

                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
              }}
              parser={value => {
                if (!value) return '' as any;
                const s = value.replace(/[^0-9,.-]/g, '');
                const lastComma = s.lastIndexOf(',');
                const lastDot = s.lastIndexOf('.');
                const lastSep = Math.max(lastComma, lastDot);

                if (lastSep === -1) {
                  return s.replace(/[^0-9-]/g, '') as any;
                }

                const intPart = s.slice(0, lastSep).replace(/[^0-9-]/g, '');
                const decPart = s
                  .slice(lastSep + 1)
                  .replace(/[^0-9]/g, '')
                  .slice(0, 2);

                return (decPart.length ? `${intPart}.${decPart}` : intPart) as any;
              }}
            />
          </Form.Item>
          <Form.Item label="Valor Atual (opcional)" name="valor_atual">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} stringMode />
          </Form.Item>
          <Form.Item label="Data de Aquisição" name="data_aquisicao">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Local" name="cod_local" rules={[{ required: true, message: 'Selecione o local' }]}>
            <Select
              placeholder="Selecione o local"
              loading={loadingRefs.locais}
              showSearch
              optionFilterProp="label"
              options={locais.map(l => ({ value: l.cod_local, label: l.nome_local }))}
            />
          </Form.Item>
          <Form.Item
            label="Categoria"
            name="cod_categoria"
            rules={[{ required: true, message: 'Selecione a categoria' }]}
          >
            <Select
              placeholder="Selecione a categoria"
              loading={loadingRefs.categorias}
              showSearch
              optionFilterProp="label"
              options={categorias.map(c => ({ value: c.cod_categoria, label: c.nome_categoria }))}
            />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="ativo">
            <Select
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'baixado', label: 'Baixado' },
                { value: 'manutenção', label: 'Manutenção' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Estado de Conservação" name="estado_conservacao" initialValue="bom">
            <Select
              options={[
                { value: 'novo', label: 'Novo' },
                { value: 'bom', label: 'Bom' },
                { value: 'regular', label: 'Regular' },
                { value: 'ruim', label: 'Ruim' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Peso (kg)" name="peso">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="Cor" name="cor">
            <Input />
          </Form.Item>
          <Form.Item label="Movimentável" name="movimentavel">
            <Select>
              <Option value={true as any}>Sim</Option>
              <Option value={false as any}>Não</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Observações" name="observacoes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>


      {/* Modal de Transferência */}
      <TransferenciaModal
        open={transferenciaModalOpen}
        onCancel={() => {
          setTransferenciaModalOpen(false);
          setBemParaTransferencia(null);
        }}
        onSuccess={() => {
          setTransferenciaModalOpen(false);
          setBemParaTransferencia(null);
          load(); // Recarregar dados após transferência
        }}
        bem={bemParaTransferencia}
      />
    </Card>
  );
};

export default AdminBens;
