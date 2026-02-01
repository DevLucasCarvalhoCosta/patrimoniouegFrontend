import type { FC } from 'react';

import './index.less';

import { Col, Row } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Overview from './overview';
import SalePercent from './salePercent';
import TimeLine from './timeLine';
import TransferenciasRecentesDashboard from './transferenciasRecentes';

const DashBoardPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const { userProfile } = useSelector((state: any) => state.user);

  useEffect(() => {
    // Simular um tempo de carregamento inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <Overview loading={loading} />
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <SalePercent loading={loading} />
        </Col>
        <Col xs={24} lg={8}>
          <TransferenciasRecentesDashboard />
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <TimeLine loading={loading} />
      </div>
    </div>
  );
};

export default DashBoardPage;
