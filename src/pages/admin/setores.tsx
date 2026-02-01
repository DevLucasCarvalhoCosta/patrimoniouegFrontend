import type { FC } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Modal, Space, Table } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

import { apiCreateSetor, apiDeleteSetor, apiListSetores, apiUpdateSetor } from '@/api/setores.api';
import ExportButtons from '@/components/common/ExportButtons';
import { addNotification } from '@/utils/notifications';

const AdminSetores: FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiListSetores();

      if (status) setData(result as any[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredData = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return data;
    return (data || []).filter((r: any) => {
      const inCodigo = String(r.cod_setor).includes(query);
      const inNome = String(r.nome_setor || '').toLowerCase().includes(query);
      const inSigla = String(r.sigla || '').toLowerCase().includes(query);
      const inDesc = String(r.descricao || '').toLowerCase().includes(query);
      return inCodigo || inNome || inSigla || inDesc;
    });
  }, [data, q]);

  const save = async (values: any) => {
    try {
      if (editing) {
        await apiUpdateSetor(editing.cod_setor, values);
        message.success('Setor atualizado');
        addNotification({
          title: 'Setor atualizado',
          operation: 'update',
          entity: 'setor',
          entityId: editing.cod_setor,
          description: `Setor "${values.nome_setor}" foi atualizado`,
        });
      } else {
        const { status, result } = await apiCreateSetor(values);

        message.success('Setor criado');
        const id = (result && (result as any).cod_setor) || undefined;

        addNotification({
          title: 'Novo setor cadastrado',
          operation: 'create',
          entity: 'setor',
          entityId: id,
          description: `Setor "${values.nome_setor}" foi cadastrado com sucesso`,
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
    { title: 'Código', dataIndex: 'cod_setor' },
    { title: 'Nome', dataIndex: 'nome_setor' },
    { title: 'Sigla', dataIndex: 'sigla' },
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
          <Button
            danger
            size="small"
            style={{ marginLeft: 8 }}
            onClick={async () => {
              await apiDeleteSetor(r.cod_setor);
              message.success('Excluído');
              addNotification({
                title: 'Setor excluído',
                operation: 'delete',
                entity: 'setor',
                entityId: r.cod_setor,
                description: `Setor "${r.nome_setor}" foi excluído`,
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
      title="Setores"
      extra={
        <Space size={8} wrap>
          <Input.Search
            allowClear
            placeholder="Buscar por código, nome, sigla ou descrição"
            onSearch={setQ}
            style={{ width: 320 }}
          />
          <ExportButtons
            columns={columns as any}
            data={filteredData}
            filename={`setores-${new Date().toISOString().slice(0,10)}`}
            title="Relatório de Setores"
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
            Novo Setor
          </Button>
        </Space>
      }
    >
      <Table rowKey="cod_setor" dataSource={filteredData} columns={columns as any} loading={loading} />
      <Modal
        title={editing ? 'Editar Setor' : 'Novo Setor'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={save}>
          <Form.Item name="nome_setor" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sigla" label="Sigla">
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

export default AdminSetores;
