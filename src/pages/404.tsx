import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Página não encontrada"
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Voltar ao Início
        </Button>
      }
    ></Result>
  );
};

export default NotFoundPage;
