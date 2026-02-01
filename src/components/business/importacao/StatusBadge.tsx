import type { ImportacaoBemItemStatus, ImportacaoStatus } from '@/interface/importacao';
import type { FC } from 'react';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Badge, Tag } from 'antd';
import React from 'react';

type AllStatus = ImportacaoStatus | ImportacaoBemItemStatus;

interface StatusBadgeProps {
  status: AllStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const STATUS_CONFIG = {
  // Status de Importação
  PARSED: {
    color: 'processing',
    text: 'Processado',
    icon: <SyncOutlined spin />,
  },
  CONFIRMED: {
    color: 'success',
    text: 'Confirmado',
    icon: <CheckCircleOutlined />,
  },
  CANCELLED: {
    color: 'error',
    text: 'Cancelado',
    icon: <CloseCircleOutlined />,
  },
  FAILED: {
    color: 'error',
    text: 'Falhou',
    icon: <ExclamationCircleOutlined />,
  },

  // Status de Item
  PENDING: {
    color: 'warning',
    text: 'Pendente',
    icon: <ClockCircleOutlined />,
  },
  READY: {
    color: 'success',
    text: 'Pronto',
    icon: <CheckCircleOutlined />,
  },
  DUPLICATE: {
    color: 'orange',
    text: 'Duplicado',
    icon: <WarningOutlined />,
  },
  ERROR: {
    color: 'error',
    text: 'Erro',
    icon: <ExclamationCircleOutlined />,
  },
  CREATED: {
    color: 'success',
    text: 'Criado',
    icon: <CheckCircleOutlined />,
  },
} as const;

const StatusBadge: FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Tag>{status}</Tag>;
  }

  const sizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <Tag color={config.color} icon={showIcon ? config.icon : undefined} className={sizeClass}>
      {config.text}
    </Tag>
  );
};

export default StatusBadge;
