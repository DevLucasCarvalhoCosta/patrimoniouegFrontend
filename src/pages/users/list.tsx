import type { UserProfile } from '@/interface/user/user';
import type { FC } from 'react';

import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiListSetores } from '@/api/setores.api';
import { apiDeleteUser, apiEditUser, apiGetAllUsers } from '@/api/user.api';

interface UsersListResponse {
  usuarios: UserProfile[];
}

const UsersList: FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [setores, setSetores] = useState<any[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const response = await apiGetAllUsers();

      if (response.status && response.result) {
        setUsers(response.result.usuarios || []);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        message.error('Acesso negado. Apenas administradores podem ver esta página.');
      } else {
        message.error('Erro ao carregar usuários');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSetores = async () => {
    setLoadingSetores(true);
    try {
      const { status, result } = await apiListSetores();
      if (status) setSetores(result || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoadingSetores(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSetores();
  }, []);

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Cargo',
      dataIndex: 'cargo',
      key: 'cargo',
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
      render: (t: string) => t,
    },
    {
      title: 'Setor',
      dataIndex: 'cod_setor',
      key: 'cod_setor',
      render: (cod_setor: number) => cod_setor,
    },
    {
      title: 'Perfil',
      dataIndex: 'perfil',
      key: 'perfil',
      render: (perfil: string) => <Tag color={perfil === 'admin' ? 'red' : 'blue'}>{perfil.toUpperCase()}</Tag>,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (record: UserProfile) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    form.setFieldsValue({
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      cargo: (user as any).cargo || '',
      cod_setor: (user as any).cod_setor || 1,
      telefone: (user as any).telefone || '',
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!editingUser) return;

      // Usar id_usuario se disponível, senão usar id
      const userId = editingUser.id_usuario || editingUser.id;
      const response = await apiEditUser(userId, values);
      
      if (response.status) {
        message.success('Usuário editado com sucesso');
        setEditModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        fetchUsers(); // Recarregar lista
      } else {
        message.error(response.message || 'Erro ao editar usuário');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.erro || error?.response?.data?.message || 'Erro ao editar usuário';
      message.error(errorMsg);
    }
  };

  const handleDelete = (user: UserProfile) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: `Deseja realmente excluir o usuário ${user.nome}?`,
      okText: 'Sim',
      cancelText: 'Não',
      okType: 'danger',
      async onOk() {
        try {
          // Usar id_usuario se disponível, senão usar id
          const userId = user.id_usuario || user.id;
          const response = await apiDeleteUser(userId);
          
          if (response.status) {
            message.success('Usuário excluído com sucesso');
            fetchUsers(); // Recarregar lista
          } else {
            message.error(response.message || 'Erro ao excluir usuário');
          }
        } catch (error: any) {
          const errorMsg = error?.response?.data?.erro || error?.response?.data?.message || 'Erro ao excluir usuário';
          message.error(errorMsg);
        }
      },
    });
  };

  return (
    <Card title="Gerenciamento de Usuários">
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/register')}>
          Cadastrar Novo Usuário
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id_usuario"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `Total ${total} usuários`,
        }}
      />

      {/* Modal de Edição */}
      <Modal
        title="Editar Usuário"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input placeholder="Nome do usuário" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email é obrigatório' },
              { type: 'email', message: 'Email inválido' },
            ]}
          >
            <Input placeholder="Email do usuário" />
          </Form.Item>

          <Form.Item
            name="cargo"
            label="Cargo"
            rules={[{ required: true, message: 'Cargo é obrigatório' }]}
          >
            <Input placeholder="Cargo do usuário" />
          </Form.Item>

          <Form.Item
            name="telefone"
            label="Telefone"
          >
            <Input placeholder="(99) 99999-9999" />
          </Form.Item>

          <Form.Item
            name="cod_setor"
            label="Setor"
            rules={[{ required: true, message: 'Setor é obrigatório' }]}
          >
            <Select
              placeholder="Selecione o setor"
              loading={loadingSetores}
              showSearch
              optionFilterProp="label"
              options={setores.map((s: any) => ({ 
                value: s.cod_setor, 
                label: s.nome_setor || `Setor ${s.cod_setor}` 
              }))}
            />
          </Form.Item>

          <Form.Item
            name="perfil"
            label="Perfil"
            rules={[{ required: true, message: 'Perfil é obrigatório' }]}
          >
            <Select placeholder="Selecione o perfil">
              <Select.Option value="admin">Administrador</Select.Option>
              <Select.Option value="local">Local</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="senha"
            label="Nova Senha (opcional)"
            help="Deixe em branco para manter a senha atual. Se preenchido, o usuário será obrigado a alterar na próxima login."
          >
            <Input.Password placeholder="Nova senha" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UsersList;
