import type { FC } from 'react';

import 'driver.js/dist/driver.min.css';

import { Button, Typography } from 'antd';

import useGuide from './useGuide';

const GuidePage: FC = () => {
  const { driverStart } = useGuide();

  return (
    <div className="guide-page ">
      <div className="innerText">
        <Typography className="guide-intro">
          Este guia irá orientá-lo através dos recursos desta aplicação, desenvolvido com{' '}
          <Button
            type="link"
            className="driverjs-link"
            href="https://github.com/kamranahmedse/driver.js"
            rel="noopener noreferrer"
            target="_blank"
          >
            driver.js
          </Button>
          .
        </Typography>
        <Button type="primary" onClick={driverStart}>
          Mostrar Guia
        </Button>
      </div>
    </div>
  );
};

export default GuidePage;
