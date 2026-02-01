import type { FC } from 'react';

import { Button, Card, Form, Input, message, Typography } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { apiAlterarSenhaTemporaria } from '@/api/user.api';
import { setUserItem } from '@/stores/user.store';
import { forceLogout } from '@/utils/auth';

const { Title, Paragraph } = Typography;

const AlterarSenhaTemporariaPage: FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userProfile } = useSelector((state: any) => state.user);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const { status, message: msg } = await apiAlterarSenhaTemporaria(values);

      if (status) {
        message.success('Senha alterada com sucesso');

        // Atualizar userProfile no Redux e localStorage
        const updated = { ...(userProfile || {}), senha_temporaria: false, primeiro_login: false } as any;
        localStorage.setItem('userProfile', JSON.stringify(updated));
        dispatch(setUserItem({ userProfile: updated }));

        navigate('/dashboard', { replace: true });
      } else {
        message.error(msg || 'Falha ao alterar senha');
      }
    } catch (error: any) {
      // Se for erro 403 ou 401 (token inválido), fazer logout
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        const errorMsg = error?.response?.data?.erro || error?.response?.data?.message || 'Token inválido';
        message.error(errorMsg);
        
        // Fazer logout e redirecionar para login
        setTimeout(() => {
          forceLogout('expired');
        }, 1500);
        return;
      }

      const err =
        error?.response?.data?.erro ||
        error?.response?.data?.message ||
        error?.message ||
        'Falha ao alterar senha';
      message.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <Card 
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <SafetyOutlined 
            style={{ 
              fontSize: '40px', 
              color: '#1890ff', 
              marginBottom: '12px' 
            }} 
          />
          <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
            Defina sua Senha
          </Title>
          <Paragraph 
            type="secondary" 
            style={{ 
              fontSize: '13px',
              margin: 0
            }}
          >
            Por segurança, você precisa definir uma nova senha antes de continuar.
          </Paragraph>
        </div>

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
        >
          <Form.Item
            label="Senha Atual"
            name="senha_atual"
            rules={[{ required: true, message: 'Informe a senha atual' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Sua senha temporária" 
              size="middle"
            />
          </Form.Item>

          <Form.Item
            label="Nova Senha"
            name="nova_senha"
            rules={[
              { required: true, message: 'Informe a nova senha' },
              { min: 6, message: 'A senha deve ter pelo menos 6 caracteres' },
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Digite sua nova senha" 
              size="middle"
            />
          </Form.Item>

          <Form.Item
            label="Confirmar Nova Senha"
            name="confirmar_senha"
            dependencies={['nova_senha']}
            hasFeedback
            rules={[
              { required: true, message: 'Confirme a nova senha' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('nova_senha') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('As senhas não coincidem'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Confirme sua nova senha" 
              size="middle"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 20, marginBottom: 8 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              size="middle"
            >
              {loading ? 'Alterando...' : 'Confirmar Nova Senha'}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Paragraph 
              type="secondary" 
              style={{ 
                fontSize: '11px',
                margin: 0 
              }}
            >
              Após a alteração, você será redirecionado automaticamente.
            </Paragraph>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AlterarSenhaTemporariaPage;
