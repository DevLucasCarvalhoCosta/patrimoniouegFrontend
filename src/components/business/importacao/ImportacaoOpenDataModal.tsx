import type { FC } from 'react';

import { CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Space } from 'antd';
import React, { useState } from 'react';

import { useImportacaoOpenData } from '@/hooks/useImportacaoOpenData';
import { TabelaBensImportacao } from './TabelaBensImportacao';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (resultado: any) => void;
}

const ImportacaoOpenDataModal: FC<Props> = ({ open, onClose, onSuccess }) => {
  const { bens, validacao, loading, fetchBens, validar, importar, editarBem, removerBem } = useImportacaoOpenData();
  const [form] = Form.useForm();
  const [erro, setErro] = useState<string | null>(null);

  const handleBuscar = async () => {
    setErro(null);
    const { unidade_administrativa } = await form.validateFields();
    try {
      await fetchBens({
        resource_id: '8ce95179-562d-45d3-85a7-a60f05d411e9',
        unidade_administrativa,
        limit: 2000,
        offset: 0,
      });
    } catch (e: any) {
      setErro(e?.message || 'Falha ao buscar dados.');
    }
  };

  const handleImportar = async () => {
    try {
      const resultado = await importar();
      onSuccess(resultado);
      onClose();
    } catch (e) {
      // mensagem já exibida no hook
    }
  };

  return (
    <Modal
      title="Importar Bens do Dados Abertos"
      open={open}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>Cancelar</Button>,
        <Button key="validar" onClick={validar} loading={loading} disabled={bens.length === 0}>Validar</Button>,
        <Button
          key="importar"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleImportar}
          loading={loading}
          disabled={
            bens.length === 0 || (!!validacao && (validacao.validacao.invalidos > 0 || validacao.validacao.duplicatas > 0))
          }
        >
          Importar
        </Button>,
      ]}
    >
      <div className="mb-4">
        <Alert
          showIcon
          type="info"
          message="Buscaremos os bens diretamente do portal de Dados Abertos do Governo de Goiás."
        />
      </div>

      <Form form={form} layout="inline" initialValues={{ unidade_administrativa: 'UNIDADE UNIVERSITÁRIA DE TRINDADE' }}>
        <Form.Item
          name="unidade_administrativa"
          label="Unidade Administrativa"
          rules={[{ required: true, message: 'Informe a unidade administrativa' }]}
        >
          <Input style={{ width: 500 }} placeholder="Ex.: UNIDADE UNIVERSITÁRIA DE TRINDADE" allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button icon={<SearchOutlined />} onClick={handleBuscar} loading={loading} type="primary">
              Buscar
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {erro && (
        <div className="mt-3">
          <Alert type="error" showIcon message={erro} />
        </div>
      )}

      <div className="mt-4">
        <TabelaBensImportacao
          bens={bens}
          validacao={validacao || undefined}
          onEditBem={editarBem}
          onRemoverBem={removerBem}
          loading={loading}
        />
      </div>
    </Modal>
  );
};

export default ImportacaoOpenDataModal;
