import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { FC } from 'react';

import { FileTextOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, Button, message, Modal, Space, Typography, Upload } from 'antd';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setModalUploadOpen, uploadPDF } from '@/stores/importacao.store';

import FilePreview from './FilePreview';
import ProcessingSpinner from './ProcessingSpinner';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface UploadPDFModalProps {
  onSuccess?: (importacaoId: string) => void;
}

const UploadPDFModal: FC<UploadPDFModalProps> = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { modalUploadOpen, uploading, error } = useSelector((state: any) => state.importacao);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File): boolean => {
    // Validar tipo
    if (file.type !== 'application/pdf') {
      message.error('Apenas arquivos PDF são aceitos');

      return false;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      message.error('Arquivo muito grande. O tamanho máximo é 10MB');

      return false;
    }

    return true;
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      message.error('Selecione um arquivo PDF');

      return;
    }

    try {
      const result = await dispatch(uploadPDF(selectedFile) as any).unwrap();

      message.success('PDF processado com sucesso!');
      setSelectedFile(null);

      // Callback de sucesso com ID da importação
      if (onSuccess && result.importacao_id) {
        onSuccess(result.importacao_id);
      }
    } catch (error: any) {
      message.error(error.message || 'Erro ao processar PDF');
    }
  }, [selectedFile, dispatch, onSuccess]);

  const uploadProps: UploadProps = {
    name: 'pdf',
    multiple: false,
    accept: '.pdf,application/pdf',
    beforeUpload: file => {
      if (validateFile(file)) {
        setSelectedFile(file);
      }

      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setSelectedFile(null);

      return true;
    },
    fileList: selectedFile
      ? [
          {
            uid: '1',
            name: selectedFile.name,
            status: 'done',
            size: selectedFile.size,
          } as UploadFile,
        ]
      : [],
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setUploadProgress(0);
      dispatch(setModalUploadOpen(false));
    }
  };

  const renderContent = () => {
    if (uploading) {
      return (
        <ProcessingSpinner
          message="Processando PDF... Aguarde enquanto extraímos os dados dos bens."
          progress={uploadProgress}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Title level={4} className="mb-2">
            <FileTextOutlined className="mr-2" />
            Importar Bens via PDF
          </Title>
          <Text type="secondary">Faça upload do relatório PDF da UEG para extrair dados dos bens permanentes</Text>
        </div>

        {error && (
          <Alert
            message="Erro no processamento"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => dispatch({ type: 'importacao/clearError' })}
          />
        )}

        <div>
          {!selectedFile ? (
            <Dragger
              {...uploadProps}
              className="border-dashed border-2 border-gray-300 hover:border-blue-400 bg-gray-50"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-4xl text-gray-400" />
              </p>
              <p className="ant-upload-text text-lg font-medium">Clique ou arraste o arquivo PDF para esta área</p>
              <p className="ant-upload-hint text-gray-500">Suporte para relatórios PDF da UEG (máx. 10MB)</p>
            </Dragger>
          ) : (
            <FilePreview
              fileName={selectedFile.name}
              fileSize={selectedFile.size}
              mimeType={selectedFile.type}
              onRemove={() => setSelectedFile(null)}
              disabled={uploading}
            />
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <Text className="text-sm text-blue-700">
            <strong>Formato esperado:</strong> Relatório de bens permanentes em PDF gerado pela UEG, contendo colunas de
            patrimônio, descrição, local, valor, etc.
          </Text>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={null}
      open={modalUploadOpen}
      onCancel={handleClose}
      maskClosable={!uploading}
      closable={!uploading}
      width={600}
      footer={
        uploading ? null : (
          <Space>
            <Button onClick={handleClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              loading={uploading}
            >
              Processar PDF
            </Button>
          </Space>
        )
      }
    >
      {renderContent()}
    </Modal>
  );
};

export default UploadPDFModal;
