import type { FC } from 'react';

import { DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Progress, Space, Typography } from 'antd';
import React from 'react';

interface FilePreviewProps {
  fileName: string;
  fileSize: number;
  mimeType: string;
  onRemove: () => void;
  disabled?: boolean;
}

const { Text } = Typography;

const FilePreview: FC<FilePreviewProps> = ({ fileName, fileSize, mimeType, onRemove, disabled = false }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime === 'application/pdf') {
      return <FileTextOutlined className="text-red-500 text-2xl" />;
    }

    return <FileTextOutlined className="text-gray-500 text-2xl" />;
  };

  return (
    <Card size="small" className="border border-gray-200 bg-gray-50" bodyStyle={{ padding: '12px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getFileIcon(mimeType)}
          <div>
            <Text strong className="text-sm">
              {fileName}
            </Text>
            <br />
            <Text type="secondary" className="text-xs">
              {formatFileSize(fileSize)} • {mimeType}
            </Text>
          </div>
        </div>

        <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} disabled={disabled} size="small" />
      </div>
    </Card>
  );
};

export default FilePreview;
