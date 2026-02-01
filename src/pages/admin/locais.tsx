import type { FC } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Modal, Space, Table } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

import { apiCreateLocal, apiDeleteLocal, apiListLocaisProtected, apiUpdateLocal } from '@/api/locais.api';
import ExportButtons from '@/components/common/ExportButtons';
import { addNotification } from '@/utils/notifications';

const AdminLocais: FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);

    try {
      const { status, result } = await apiListLocaisProtected();

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
      const inCodigo = String(r.cod_local).includes(query);
      const inNome = String(r.nome_local || '').toLowerCase().includes(query);
      const inSetor = String(r.cod_setor || '').includes(query);
      const inDesc = String(r.descricao || '').toLowerCase().includes(query);
      return inCodigo || inNome || inSetor || inDesc;
    });
  }, [data, q]);

  const save = async (values: any) => {
    try {
      if (editing) {
        await apiUpdateLocal(editing.cod_local, values);
        message.success('Local atualizado');
        addNotification({
          title: 'Local atualizado',
          operation: 'update',
          entity: 'local',
          entityId: editing.cod_local,
          description: `Local "${values.nome_local}" foi atualizado`,
        });
      } else {
        const { status, result } = await apiCreateLocal(values);

        message.success('Local criado');
        const id = (result && (result as any).cod_local) || undefined;

        addNotification({
          title: 'Novo local cadastrado',
          operation: 'create',
          entity: 'local',
          entityId: id,
          description: `Local "${values.nome_local}" foi cadastrado com sucesso`,
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
    { title: 'Código', dataIndex: 'cod_local' },
    { title: 'Nome', dataIndex: 'nome_local' },
    { title: 'Setor', dataIndex: 'cod_setor' },
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
              await apiDeleteLocal(r.cod_local);
              message.success('Excluído');
              addNotification({
                title: 'Local excluído',
                operation: 'delete',
                entity: 'local',
                entityId: r.cod_local,
                description: `Local "${r.nome_local}" foi excluído`,
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
      title="Locais"
      extra={
        <Space size={8} wrap>
          <Input.Search
            allowClear
            placeholder="Buscar por código, nome, setor ou descrição"
            onSearch={setQ}
            style={{ width: 320 }}
          />
          <ExportButtons
            columns={columns as any}
            data={filteredData}
            filename={`locais-${new Date().toISOString().slice(0,10)}`}
            title="Relatório de Locais"
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
            Novo Local
          </Button>
        </Space>
      }
    >
      <Table rowKey="cod_local" dataSource={filteredData} columns={columns as any} loading={loading} />
      <Modal
        title={editing ? 'Editar Local' : 'Novo Local'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={save}>
          <Form.Item name="nome_local" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="cod_setor" label="Código do Setor" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminLocais;
