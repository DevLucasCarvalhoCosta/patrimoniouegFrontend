import type { RegisterParams } from '@/interface/user/login';
import type { FC } from 'react';

import { Button, Card, Form, Input, message, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiListSetores } from '@/api/setores.api';
import { apiRegister } from '@/api/user.api';
import { addNotification } from '@/utils/notifications';

const { Option } = Select;

const UserRegister: FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [setores, setSetores] = useState<any[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);

  useEffect(() => {
    const loadSetores = async () => {
      setLoadingSetores(true);

      try {
        const { status, result } = await apiListSetores();

        if (status) setSetores(result || []);
      } finally {
        setLoadingSetores(false);
      }
    };

    loadSetores();
  }, []);

  const maskPhone = (value: string) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 10) {
      // (99) 9999-9999
      return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }

    // (99) 99999-9999
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  };

  const onFinish = async (values: RegisterParams) => {
    try {
      const response = await apiRegister(values);

      if (response.status) {
        message.success('Usuário cadastrado com sucesso!');
        const created = response.result?.usuario || response.result;
        const id = created?.id_usuario || created?.id || undefined;

        addNotification({
          title: 'Novo usuário cadastrado',
          operation: 'create',
          entity: 'usuario',
          entityId: id,
          description: `Usuário "${values.nome}" foi cadastrado com sucesso`,
        });
        form.resetFields();
        navigate('/users/list');
      } else {
        message.error(response.message || 'Erro ao cadastrar usuário');
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        message.error('Acesso negado. Apenas administradores podem cadastrar usuários.');
      } else if (error?.response?.data?.erro) {
        message.error(error.response.data.erro);
      } else {
        message.error('Erro ao cadastrar usuário');
      }
    }
  };

  return (
    <Card title="Cadastrar Novo Usuário">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          perfil: 'local',
          cod_setor: 1,
        }}
      >
        <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Por favor, insira o nome' }]}>
          <Input placeholder="Digite o nome completo" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Por favor, insira o email' },
            { type: 'email', message: 'Por favor, insira um email válido' },
          ]}
        >
          <Input placeholder="Digite o email" />
        </Form.Item>

        <Form.Item
          label="Senha"
          name="senha"
          rules={[
            { required: true, message: 'Por favor, insira a senha' },
            { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' },
          ]}
        >
          <Input.Password placeholder="Digite a senha" />
        </Form.Item>

        <Form.Item label="Cargo" name="cargo" rules={[{ required: true, message: 'Por favor, insira o cargo' }]}>
          <Input placeholder="Digite o cargo" />
        </Form.Item>

        <Form.Item
          label="Telefone"
          name="telefone"
          getValueFromEvent={e => maskPhone(e?.target?.value)}
          rules={[
            { required: true, message: 'Por favor, insira o telefone' },
            { pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/, message: 'Formato inválido. Use (99) 99999-9999' },
          ]}
        >
          <Input placeholder="(99) 99999-9999" inputMode="tel" maxLength={16} />
        </Form.Item>

        <Form.Item label="Setor" name="cod_setor" rules={[{ required: true, message: 'Selecione o setor' }]}>
          <Select
            placeholder="Selecione o setor"
            loading={loadingSetores}
            showSearch
            optionFilterProp="label"
            options={setores.map((s: any) => ({ value: s.cod_setor, label: s.nome_setor || `Setor ${s.cod_setor}` }))}
          />
        </Form.Item>

        <Form.Item label="Perfil" name="perfil" rules={[{ required: true, message: 'Por favor, selecione o perfil' }]}>
          <Select placeholder="Selecione o perfil">
            <Option value="admin">Administrador</Option>
            <Option value="local">Local</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="primary" htmlType="submit">
              Cadastrar Usuário
            </Button>
            <Button onClick={() => navigate('/users/list')}>Voltar</Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserRegister;
