import type { ImportacaoBem } from '@/interface/importacao';
import type { FC } from 'react';

import { Progress, Space, Typography } from 'antd';
import React from 'react';

interface ImportacaoProgressProps {
  importacao: ImportacaoBem;
  showLabels?: boolean;
  size?: 'small' | 'default' | 'large';
}

const { Text } = Typography;

const ImportacaoProgress: FC<ImportacaoProgressProps> = ({ importacao, showLabels = true, size = 'default' }) => {
  const total = importacao.total_linhas;
  const processados = importacao.criadas + importacao.ignoradas + importacao.com_erro;
  const progress = total > 0 ? Math.round((processados / total) * 100) : 0;

  const getStatus = (): 'success' | 'exception' | 'normal' | 'active' => {
    if (importacao.status === 'CONFIRMED') return 'success';
    if (importacao.status === 'FAILED' || importacao.status === 'CANCELLED') return 'exception';
    if (importacao.status === 'PARSED' && progress === 100) return 'success';

    return 'active';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Text className="text-sm font-medium">Progresso da Importação</Text>
        <Text className="text-sm text-gray-500">
          {processados}/{total} itens
        </Text>
      </div>

      <Progress percent={progress} status={getStatus()} size={size as any} format={() => `${processados}/${total}`} />

      {showLabels && (
        <div className="flex justify-between text-xs">
          <Space size="large">
            <Text className="text-green-600">✅ {importacao.criadas} criados</Text>
            <Text className="text-yellow-600">⏸️ {importacao.ignoradas} ignorados</Text>
            <Text className="text-red-600">❌ {importacao.com_erro} com erro</Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default ImportacaoProgress;
