import type { ImportacaoBem } from '@/interface/importacao';
import type { FC } from 'react';

import { CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Col, Divider, List, Modal, Row, Space, Statistic, Typography } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { confirmarImportacao, setModalConfirmacaoOpen } from '@/stores/importacao.store';

interface ConfirmarImportacaoModalProps {
  importacao: ImportacaoBem | null;
}

const { Title, Text } = Typography;

const ConfirmarImportacaoModal: FC<ConfirmarImportacaoModalProps> = ({ importacao }) => {
  const dispatch = useDispatch();
  const { modalConfirmacaoOpen, loadingConfirmacao, itens, dadosNormalizacao } = useSelector(
    (state: any) => state.importacao,
  );

  const [confirmado, setConfirmado] = useState(false);

  const handleConfirmar = async () => {
    if (!importacao || !confirmado) return;

    try {
      await dispatch(confirmarImportacao(importacao.id) as any).unwrap();
      setConfirmado(false);
    } catch (error: any) {
      console.error('Erro ao confirmar importação:', error);
    }
  };

  const handleClose = () => {
    if (!loadingConfirmacao) {
      setConfirmado(false);
      dispatch(setModalConfirmacaoOpen(false));
    }
  };

  if (!importacao) return null;

  // Calcular estatísticas
  const itensReady = itens.filter((item: any) => item.status === 'READY');
  const itensDuplicate = itens.filter((item: any) => item.status === 'DUPLICATE');
  const itensError = itens.filter((item: any) => item.status === 'ERROR');
  const itensPending = itens.filter((item: any) => item.status === 'PENDING');

  const warnings = [];

  if (itensDuplicate.length > 0) {
    warnings.push({
      type: 'warning' as const,
      message: `${itensDuplicate.length} itens duplicados serão ignorados`,
      description: 'Patrimônios que já existem no sistema',
    });
  }

  if (itensError.length > 0) {
    warnings.push({
      type: 'error' as const,
      message: `${itensError.length} itens com erro serão ignorados`,
      description: 'Itens com dados inválidos ou incompletos',
    });
  }

  if (itensPending.length > 0) {
    warnings.push({
      type: 'warning' as const,
      message: `${itensPending.length} itens pendentes serão ignorados`,
      description: 'Itens que ainda precisam de normalização',
    });
  }

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-green-500" />
          Confirmar Importação
        </Space>
      }
      open={modalConfirmacaoOpen}
      onCancel={handleClose}
      maskClosable={!loadingConfirmacao}
      closable={!loadingConfirmacao}
      width={700}
      footer={
        <Space>
          <Button onClick={handleClose} disabled={loadingConfirmacao}>
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirmar}
            disabled={!confirmado || loadingConfirmacao}
            loading={loadingConfirmacao}
          >
            Confirmar Importação
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Resumo da importação */}
        <div>
          <Title level={5} className="mb-3">
            Resumo da Importação
          </Title>
          <Text type="secondary" className="block mb-4">
            Arquivo: <Text strong>{importacao.arquivo_nome}</Text>
          </Text>

          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Total de Itens" value={importacao.total_linhas} valueStyle={{ color: '#1890ff' }} />
            </Col>
            <Col span={6}>
              <Statistic title="Serão Criados" value={itensReady.length} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={6}>
              <Statistic title="Duplicados" value={itensDuplicate.length} valueStyle={{ color: '#fa8c16' }} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Com Erro"
                value={itensError.length + itensPending.length}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Warnings e alertas */}
        {warnings.length > 0 && (
          <div>
            <Title level={5} className="mb-3">
              <WarningOutlined className="text-orange-500 mr-2" />
              Avisos Importantes
            </Title>
            <Space direction="vertical" className="w-full">
              {warnings.map((warning, idx) => (
                <Alert
                  key={idx}
                  message={warning.message}
                  description={warning.description}
                  type={warning.type}
                  showIcon
                />
              ))}
            </Space>
          </div>
        )}

        {/* Confirmação */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <Checkbox checked={confirmado} onChange={e => setConfirmado(e.target.checked)} disabled={loadingConfirmacao}>
            <Text strong>
              Confirmo que revisei todos os dados e estou ciente dos avisos acima. Desejo prosseguir com a criação de{' '}
              <Text className="text-green-600">{itensReady.length} bens</Text> no sistema.
            </Text>
          </Checkbox>
        </div>

        {/* Informações adicionais */}
        <Alert
          message="Após a confirmação"
          description={
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Os bens válidos serão criados permanentemente na tabela de bens</li>
              <li>Esta ação não pode ser desfeita</li>
              <li>Você poderá visualizar os bens criados na listagem geral</li>
              <li>Um relatório detalhado será gerado ao final do processo</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </div>
    </Modal>
  );
};

export default ConfirmarImportacaoModal;
