import type { FC } from 'react';

import './index.less';

import { Typography } from 'antd';

const RoutePermissionPage: FC = () => {
  return (
    <div className="permission-page">
      <Typography className="permission-intro">Login realizado com sucesso!</Typography>
    </div>
  );
};

export default RoutePermissionPage;
