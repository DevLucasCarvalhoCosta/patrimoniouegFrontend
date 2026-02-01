import type { LoginParams } from '@/interface/user/login';
import type { FC } from 'react';

import './index.less';

import { Button, Checkbox, Form, Input, message, theme as antTheme } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { apiLogin } from '@/api/user.api';
import { setUserItem } from '@/stores/user.store';

const getInitialValues = (): LoginParams => {
  const rememberedEmail = localStorage.getItem('rememberedEmail');

  return {
    email: rememberedEmail || '',
    senha: '',
    remember: !!rememberedEmail,
  };
};

const LoginForm: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { logged } = useSelector((state: any) => state.user);
  const { token } = antTheme.useToken();

  const onFinished = async (form: LoginParams) => {
    try {
      // Chamar a API diretamente
      const response = await apiLogin(form);

      // Se a API retornou sucesso (status: true), atualizar o estado e navegar
      if (response.status && response.result) {
        const { token, usuario } = response.result;

        // Mapear id para id_usuario para compatibilidade
        const usuarioMapeado = {
          ...usuario,
          id_usuario: usuario.id, // Garantir que id_usuario existe
        };

        // Salvar no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userProfile', JSON.stringify(usuarioMapeado));
        localStorage.setItem('username', usuario.nome);

        // Remember email if requested
        try {
          if (form.remember) localStorage.setItem('rememberedEmail', form.email);
          else localStorage.removeItem('rememberedEmail');
        } catch {}

        // Atualizar o estado do Redux
        dispatch(
          setUserItem({
            logged: true,
            username: usuario.nome,
            userProfile: usuarioMapeado,
          }),
        );

        // Verificar se precisa alterar senha temporária
        const precisaAlterar = !!usuario?.senha_temporaria;
        const from = new URLSearchParams(location.search).get('from') || '/dashboard';

        navigate(precisaAlterar ? '/alterar-senha-temporaria' : from, { replace: true });
      } else {
        // Se não deu sucesso, mostrar mensagem de erro
        message.error(response.message || 'Erro no login');
      }
    } catch (error: any) {
      // Se for erro 401, mostrar mensagem específica
      if (error?.response?.status === 401) {
        const errorMsg = error?.response?.data?.erro || error?.response?.data?.message || 'Email ou senha incorretos';

        message.error(errorMsg);
      } else if (error?.response?.data?.erro || error?.response?.data?.message) {
        // Se a API retornou uma mensagem de erro, usar ela
        const errorMsg = error?.response?.data?.erro || error?.response?.data?.message;

        message.error(errorMsg);
      } else {
        // Mensagem genérica para outros erros
        message.error('Erro ao fazer login. Tente novamente.');
      }
    }
  };

  return (
    <div className="login-page" style={{ backgroundColor: token.colorBgContainer }}>
      <Form<LoginParams> onFinish={onFinished} className="login-page-form" initialValues={getInitialValues()}>
        <div className="logo">
          <img src="/ueg.PNG" alt="UEG" />
        </div>
        <h2>Controle Patrimonial UEG</h2>
        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              message: 'Por favor, insira o email',
            },
          ]}
        >
          <Input placeholder="Email" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="senha"
          rules={[
            {
              required: true,
              message: 'Por favor, insira a senha',
            },
          ]}
        >
          <Input type="password" placeholder="Senha" autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>Lembrar usuário</Checkbox>
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" className="login-page-form_button">
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginForm;
