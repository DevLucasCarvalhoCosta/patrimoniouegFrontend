import type { FC } from 'react';
import type { RouteProps } from 'react-router';

import { Button, Result } from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { ensureValidAuthOrRedirect, isLogoutInProgress } from '@/utils/auth';

interface PrivateRouteProps extends RouteProps {
  adminOnly?: boolean;
}

const PrivateRoute: FC<PrivateRouteProps> = props => {
  const { logged, userProfile } = useSelector((state: any) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Checar validade do token SEMPRE que acessar rota protegida
  const valid = ensureValidAuthOrRedirect();
  const loggingOut = isLogoutInProgress();

  // Redirecionar para alteração de senha se estiver com senha temporária
  useEffect(() => {
    if (logged && userProfile?.senha_temporaria && location.pathname !== '/alterar-senha-temporaria') {
      navigate('/alterar-senha-temporaria', { replace: true });
    }
  }, [logged, userProfile, location.pathname, navigate]);

  // Se estamos deslogando, evita renderizar 403/NotFound e mantém um spinner curto
  if (loggingOut) {
    // Enquanto desloga, não renderiza conteúdo nem 403/404; o redirect ocorrerá em seguida
    return null;
  }

  // Primeiro verifica se está logado
  if (!logged) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Acesso não autorizado"
        extra={
          <Button
            type="primary"
            onClick={() => navigate(`/login${'?from=' + encodeURIComponent(location.pathname)}`, { replace: true })}
          >
            Ir para Login
          </Button>
        }
      />
    );
  }

  // Se a rota requer admin, verifica se é admin
  if (props.adminOnly) {
    const isAdmin = userProfile?.perfil === 'admin';

    if (!isAdmin) {
      return (
        <Result
          status="403"
          title="403"
          subTitle="Acesso negado. Esta página é restrita a administradores."
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          }
        />
      );
    }
  }

  return props.element as React.ReactElement;
};

export default PrivateRoute;
