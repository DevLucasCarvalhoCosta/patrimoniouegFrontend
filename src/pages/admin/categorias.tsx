import type { FC } from 'react';

import { DeleteOutlined, PlusOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { Button, Card, Form, Image, Input, message, Modal, Space, Table, Upload } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { apiCreateCategoria, apiDeleteCategoria, apiListCategoriasProtected, apiUpdateCategoria, apiUploadCategoriaImagens, apiRemoverImagemCategoria } from '@/api/categorias.api';
import { buildAssetUrl } from '@/config/api';
import { addNotification } from '@/utils/notifications';
import ExportButtons from '@/components/common/ExportButtons';

const AdminCategorias: FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();
  const { userProfile } = useSelector((state: any) => state.user);

  const filteredData = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return data;
    return (data || []).filter((r: any) => {
      const inCodigo = String(r.cod_categoria).includes(query);
      const inNome = String(r.nome_categoria || '').toLowerCase().includes(query);
      const inDesc = String(r.descricao || '').toLowerCase().includes(query);
      return inCodigo || inNome || inDesc;
    });
  }, [data, q]);

  const load = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiListCategoriasProtected();

      if (status) setData(result as any[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (values: any) => {
    try {
      if (editing) {
        await apiUpdateCategoria(editing.cod_categoria, values);
        message.success('Categoria atualizada');
        addNotification({
          title: 'Categoria atualizada',
          operation: 'update',
          entity: 'categoria',
          entityId: editing.cod_categoria,
          description: `Categoria "${values.nome_categoria}" foi atualizada`,
        });
      } else {
        const { status, result } = await apiCreateCategoria(values);

        message.success('Categoria criada');
        const id = (result && (result as any).cod_categoria) || undefined;

        addNotification({
          title: 'Nova categoria cadastrada',
          operation: 'create',
          entity: 'categoria',
          entityId: id,
          description: `Categoria "${values.nome_categoria}" foi cadastrada com sucesso`,
        });
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.erro || 'Erro ao salvar');
    }
  };

  const columns = [
    { title: 'Código', dataIndex: 'cod_categoria' },
    { title: 'Nome', dataIndex: 'nome_categoria' },
    {
      title: 'Imagens da categoria',
      render: (_: any, r: any) => {
        const srcs = [
          r.imagem1,
          r.imagem2,
          r.imagem3,
          r.imagem4,
          r.imagem5,
          r.imagem6,
          r.imagem7,
          r.imagem8,
          r.imagem9,
          r.imagem10,
        ]
          .map((s: any) => (s && String(s).trim() ? String(s) : ''))
          .filter(Boolean) as string[];

        if (!srcs.length) return <span style={{ color: '#999' }}>Sem imagens</span>;

        const first = srcs[0];
        const rest = srcs.slice(1);
        return (
          <Image.PreviewGroup>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Image
                src={buildAssetUrl(first)}
                width={60}
                height={45}
                style={{ objectFit: 'cover' }}
                alt={`Imagem 1 da categoria ${r.nome_categoria}`}
              />
              {rest.map((s: string, idx: number) => (
                <Image
                  key={idx}
                  src={buildAssetUrl(s)}
                  // Hidden thumbnails; still included in the preview group
                  style={{ display: 'none' }}
                  alt={`Imagem ${idx + 2} da categoria ${r.nome_categoria}`}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        );
      },
    },
    {
      title: 'Ações',
      render: (_: any, r: any) => (
        <>
          <Button
            size="small"
            onClick={() => {
              setEditing(r);
              setOpen(true);
              form.setFieldsValue(r);
            }}
          >
            Editar
          </Button>
          {userProfile?.perfil === 'admin' && (
            <Button
              size="small"
              type="default"
              style={{ marginLeft: 8 }}
              onClick={() => {
                setEditing(r);
                Modal.info({
                  title: `Imagens da categoria: ${r.nome_categoria}`,
                  icon: null,
                  content: <CategoriaImagensManager categoria={r} onChanged={load} />,
                  okText: 'Fechar',
                  width: 720,
                });
              }}
            >
              Gerir imagens
            </Button>
          )}
          <Button
            danger
            size="small"
            style={{ marginLeft: 8 }}
            onClick={async () => {
              await apiDeleteCategoria(r.cod_categoria);
              message.success('Excluída');
              addNotification({
                title: 'Categoria excluída',
                operation: 'delete',
                entity: 'categoria',
                entityId: r.cod_categoria,
                description: `Categoria "${r.nome_categoria}" foi excluída`,
              });
              load();
            }}
          >
            Excluir
          </Button>
        </>
      ),
    },
  ];

  return (
    <Card
      title="Categorias"
      extra={
        <Space size={8} wrap>
          <Input.Search allowClear placeholder="Buscar por código, nome ou descrição" onSearch={setQ} style={{ width: 280 }} />
          <ExportButtons
            columns={columns as any}
            data={filteredData}
            filename={`categorias-${new Date().toISOString().slice(0,10)}`}
            title="Relatório de Categorias"
            subtitle={q ? `Filtro de busca: ${q}` : undefined}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nova Categoria
          </Button>
        </Space>
      }
    >
      <Table rowKey="cod_categoria" dataSource={filteredData} columns={columns as any} loading={loading} />
      <Modal
        title={editing ? 'Editar Categoria' : 'Nova Categoria'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={save}>
          <Form.Item name="nome_categoria" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminCategorias;

const CategoriaImagensManager: FC<{ categoria: any; onChanged?: () => void }> = ({ categoria, onChanged }) => {
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [cat, setCat] = useState<any>(categoria);
  const [fileList, setFileList] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const imagens = [
    cat.imagem1,
    cat.imagem2,
    cat.imagem3,
    cat.imagem4,
    cat.imagem5,
    cat.imagem6,
    cat.imagem7,
    cat.imagem8,
    cat.imagem9,
    cat.imagem10,
  ];

  const filled = imagens.filter((s: any) => s && String(s).trim()).length;
  const remaining = 10 - filled;

  const isValidFile = (file: File) => {
    const isValidType = /image\/(jpeg|png|webp)/i.test(file.type);
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isValidType) message.error('Apenas imagens JPEG/PNG/WebP');
    if (!isLt5M) message.error('Cada arquivo deve ter até 5MB');
    return isValidType && isLt5M;
  };

  const beforeUpload = (file: any) => {
    if (remaining <= 0) {
      message.warning('Limite de 10 imagens atingido');
      return Upload.LIST_IGNORE;
    }
    const ok = isValidFile(file as File);
    if (!ok) return Upload.LIST_IGNORE;
    setFileList(prev => {
      const next = [...prev, file];
      if (next.length > remaining) {
        message.warning(`Você pode enviar no máximo ${remaining} arquivo(s) agora`);
        return next.slice(0, remaining);
      }
      return next;
    });
    return false; // prevent auto upload
  };

  const onRemove = (file: any) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid));
    return true;
  };

  const refreshCat = async () => {
    try {
      const { status, result } = await apiListCategoriasProtected();
      if (status && Array.isArray(result)) {
        const found = (result as any[]).find((c: any) => c.cod_categoria === cat.cod_categoria);
        if (found) setCat(found);
      }
    } catch {}
  };

  const handleSendFiles = async () => {
    if (!fileList.length) return;
    const files: File[] = fileList.map((f: any) => f.originFileObj || f).slice(0, remaining);
    if (!files.length) return;
    setSending(true);
    try {
      await apiUploadCategoriaImagens(cat.cod_categoria, files);
      message.success('Imagens enviadas');
      setFileList([]);
      await refreshCat();
      onChanged && onChanged();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) message.error('Sem permissão para enviar imagens');
      else message.error(e?.response?.data?.erro || 'Falha no upload');
    } finally {
      setSending(false);
    }
  };

  const removeAt = async (index1Based: number) => {
    setBusyIndex(index1Based);
    try {
      await apiRemoverImagemCategoria(cat.cod_categoria, index1Based);
      message.success('Imagem removida');
      setCat((prev: any) => ({ ...prev, [`imagem${index1Based}`]: null }));
      await refreshCat();
      onChanged && onChanged();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) message.error('Sem permissão para remover');
      else message.error(e?.response?.data?.erro || 'Falha ao remover');
    } finally {
      setBusyIndex(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Upload.Dragger
          multiple
          name="imagens"
          accept="image/jpeg,image/png,image/webp"
          beforeUpload={beforeUpload}
          onRemove={onRemove}
          fileList={fileList as any}
          disabled={busyIndex != null || remaining <= 0}
          maxCount={remaining}
          listType="picture"
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p>Selecionar imagens (restam {remaining} de 10)</p>
        </Upload.Dragger>
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button type="primary" icon={<UploadOutlined />} onClick={handleSendFiles} disabled={!fileList.length} loading={sending}>
            Enviar {fileList.length} arquivo(s)
          </Button>
        </div>
      </div>
      <Space size={8} wrap>
        {Array.from({ length: 10 }).map((_, idx) => {
          const src = cat[`imagem${idx + 1}`];
          return (
            <div key={idx} style={{ position: 'relative' }}>
              {src ? (
                <Image
                  src={buildAssetUrl(src)}
                  width={120}
                  height={90}
                  style={{ objectFit: 'cover', background: '#f5f5f5' }}
                  alt={`Imagem ${idx + 1} da categoria ${cat.nome_categoria}`}
                  fallback="data:image/gif;base64,R0lGODlhAQABAAAAACw="
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 90,
                    border: '1px dashed #d9d9d9',
                    borderRadius: 6,
                    background: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(0,0,0,0.45)',
                  }}
                  aria-label={`Imagem ${idx + 1} vazia da categoria ${cat.nome_categoria}`}
                >
                  <div style={{ textAlign: 'center', fontSize: 12 }}>
                    <PictureOutlined style={{ fontSize: 20 }} />
                    <div>Vazio</div>
                  </div>
                </div>
              )}
              {src ? (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={busyIndex === idx + 1}
                  style={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={() => removeAt(idx + 1)}
                />
              ) : null}
            </div>
          );
        })}
      </Space>
    </div>
  );
};
