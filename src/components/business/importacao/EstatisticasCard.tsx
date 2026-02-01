import type { FC, ReactNode } from 'react';

import { Card, Statistic } from 'antd';
import React from 'react';

interface EstatisticasCardProps {
  titulo: string;
  valor: number;
  cor: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  icone: ReactNode;
  loading?: boolean;
  extra?: ReactNode;
  formatter?: (value: any) => ReactNode;
}

const COR_CONFIG = {
  blue: '#1890ff',
  green: '#52c41a',
  red: '#f5222d',
  yellow: '#fa8c16',
  purple: '#722ed1',
};

const EstatisticasCard: FC<EstatisticasCardProps> = ({
  titulo,
  valor,
  cor,
  icone,
  loading = false,
  extra,
  formatter,
}) => {
  const iconColor = COR_CONFIG[cor];

  return (
    <Card
      loading={loading}
      bodyStyle={{ 
        padding: '20px 24px',
      }}
      style={{
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Statistic
            title={titulo}
            value={valor}
            valueStyle={{
              fontSize: '28px',
              fontWeight: 'bold',
              lineHeight: '32px',
            }}
            formatter={formatter}
          />
          {extra && <div style={{ marginTop: '8px' }}>{extra}</div>}
        </div>
        <div style={{ 
          fontSize: '32px', 
          color: iconColor, 
          marginLeft: '16px', 
          opacity: 0.8,
        }}>
          {icone}
        </div>
      </div>
    </Card>
  );
};

export default EstatisticasCard;
