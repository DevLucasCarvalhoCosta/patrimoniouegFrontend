import type { FC } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Progress, Spin, Typography } from 'antd';
import React from 'react';

interface ProcessingSpinnerProps {
  message: string;
  progress?: number; // 0-100
  size?: 'small' | 'default' | 'large';
  showProgress?: boolean;
}

const { Text } = Typography;

const ProcessingSpinner: FC<ProcessingSpinnerProps> = ({
  message,
  progress,
  size = 'default',
  showProgress = true,
}) => {
  const hasProgress = typeof progress === 'number' && progress >= 0 && progress <= 100;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'small' ? 24 : 36 }} spin />}
        size={size}
      />

      <div className="mt-4 text-center max-w-md">
        <Text className="text-base text-gray-700">{message}</Text>

        {hasProgress && showProgress && (
          <div className="mt-3 w-64">
            <Progress
              percent={progress}
              size="small"
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
              format={percent => `${percent}%`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingSpinner;
