import type { BemImportacao } from '@/interface/importacao';

import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  message,
  Modal,
  Progress,
  Row,
  Spin,
  Typography,
  Upload,
} from 'antd';
import React from 'react';

import { useImportacaoLote } from '@/hooks/useImportacaoLote';
import { DebugPDFInfo } from './DebugPDFInfo';
import { TabelaBensImportacao } from './TabelaBensImportacao';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (resultado: any) => void;
}

export const NovaImportacaoLotePDFModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const {
    etapaAtual,
    dadosExtraidos,
    bensEditaveis,
    validacao,
    loading,
    progress,
    processarArquivo,
    validarDados,
    executarImportacao,
    editarBem,
    removerBem,
    resetarEstado,
    voltarEtapa,
  } = useImportacaoLote();

  const handleClose = () => {
    resetarEstado();
    onClose();
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      message.error('Por favor, selecione apenas arquivos PDF');
      return false;
    }
    
    await processarArquivo(file);
    return false;
  };

  const handleExecutarComSucesso = async () => {
    try {
      const resultado = await executarImportacao();
      
      setTimeout(() => {
        onSuccess(resultado);
        handleClose();
      }, 2000);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const renderEtapaUpload = () => (
    <div className="text-center py-8">
      <Dragger
        name="pdf"
        multiple={false}
        accept=".pdf"
        beforeUpload={handleFileUpload}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">Clique ou arraste o relatório PDF aqui</p>
        <p className="ant-upload-hint">
          Suporte apenas para arquivos PDF do relatório patrimonial da UEG
        </p>
      </Dragger>
    </div>
  );

  const renderEtapaProcessando = () => (
    <div className="text-center py-8">
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
        size="large" 
      />
      <div className="mt-4">
        <Title level={4}>Processando PDF...</Title>
        <Progress percent={progress} status="active" />
        <Text type="secondary">
          Extraindo dados do relatório patrimonial. Isso pode levar alguns segundos.
        </Text>
      </div>
    </div>
  );

  const renderEtapaRevisao = () => (
    <div>
      {/* Resumo dos dados extraídos */}
      {dadosExtraidos && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card bodyStyle={{ padding: '16px', textAlign: 'center' }}>
              <Title level={4} style={{ margin: '0 0 4px 0', color: '#1890ff' }}>
                {dadosExtraidos.estatisticas.total_bens}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Bens Encontrados</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card bodyStyle={{ padding: '16px', textAlign: 'center' }}>
              <Title level={4} style={{ margin: '0 0 4px 0', color: '#52c41a' }}>
                {dadosExtraidos.estatisticas.campos_preenchidos.numero_patrimonio}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Com Patrimônio</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card bodyStyle={{ padding: '16px', textAlign: 'center' }}>
              <Title level={4} style={{ margin: '0 0 4px 0', color: '#fa8c16' }}>
                {dadosExtraidos.estatisticas.campos_preenchidos.marca}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Com Marca</Text>
            </Card>
          </Col>
          <Col span={6}>
            <Card bodyStyle={{ padding: '16px', textAlign: 'center' }}>
              <Title level={4} style={{ margin: '0 0 4px 0', color: '#722ed1' }}>
                {dadosExtraidos.estatisticas.campos_preenchidos.modelo}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Com Modelo</Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* Alertas de validação */}
      {validacao && (
        <div className="mb-4">
          {validacao.validacao.invalidos > 0 && (
            <Alert
              type="warning"
              message={`${validacao.validacao.invalidos} itens com problemas`}
              description="Revise os dados destacados em vermelho na tabela abaixo."
              className="mb-2"
            />
          )}
          
          {validacao.validacao.duplicatas > 0 && (
            <Alert
              type="error"
              message={`${validacao.validacao.duplicatas} duplicatas encontradas`}
              description="Alguns números de patrimônio já existem no sistema."
              className="mb-2"
            />
          )}

          {(validacao.validacao.relacionamentos_necessarios.setores_criar.length > 0 ||
            validacao.validacao.relacionamentos_necessarios.locais_criar.length > 0 ||
            validacao.validacao.relacionamentos_necessarios.categorias_criar.length > 0) && (
            <Alert
              type="info"
              message="Novos relacionamentos serão criados"
              description={
                <div>
                  {validacao.validacao.relacionamentos_necessarios.setores_criar.length > 0 && (
                    <div>Setores: {validacao.validacao.relacionamentos_necessarios.setores_criar.join(', ')}</div>
                  )}
                  {validacao.validacao.relacionamentos_necessarios.locais_criar.length > 0 && (
                    <div>Locais: {validacao.validacao.relacionamentos_necessarios.locais_criar.join(', ')}</div>
                  )}
                  {validacao.validacao.relacionamentos_necessarios.categorias_criar.length > 0 && (
                    <div>Categorias: {validacao.validacao.relacionamentos_necessarios.categorias_criar.join(', ')}</div>
                  )}
                </div>
              }
              className="mb-2"
            />
          )}
        </div>
      )}

      {/* Debug info */}
      {dadosExtraidos && (
        <DebugPDFInfo dadosExtraidos={dadosExtraidos} />
      )}

      {/* Tabela de bens para revisão */}
      <TabelaBensImportacao
        bens={bensEditaveis}
        validacao={validacao}
        onEditBem={editarBem}
        onRemoverBem={removerBem}
        loading={loading}
      />
    </div>
  );

  const renderEtapaProcesso = () => (
    <div className="text-center py-8">
      <Spin size="large" />
      <div className="mt-4">
        <Title level={4}>
          {etapaAtual === 'validando' && 'Validando dados...'}
          {etapaAtual === 'importando' && 'Executando importação...'}
        </Title>
        <Text type="secondary">
          {etapaAtual === 'validando' && 'Verificando duplicatas e relacionamentos.'}
          {etapaAtual === 'importando' && 'Criando bens e relacionamentos no sistema.'}
        </Text>
      </div>
    </div>
  );

  const renderEtapaConcluido = () => (
    <div className="text-center py-8">
      <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
      <div className="mt-4">
        <Title level={3}>Importação Concluída!</Title>
        <Text type="secondary">
          Os bens foram importados com sucesso para o sistema.
        </Text>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (etapaAtual) {
      case 'upload': return 'Nova Importação em Lote - Upload PDF';
      case 'processando': return 'Processando PDF...';
      case 'revisao': return 'Revisão dos Dados Extraídos';
      case 'validando': return 'Validando Dados...';
      case 'importando': return 'Executando Importação...';
      case 'concluido': return 'Importação Concluída';
      default: return 'Importação em Lote';
    }
  };

  const getFooterButtons = () => {
    switch (etapaAtual) {
      case 'upload':
        return [
          <Button key="cancel" onClick={handleClose}>
            Cancelar
          </Button>,
        ];
      
      case 'processando':
      case 'validando':
      case 'importando':
        return [];
      
      case 'revisao':
        return [
          <Button key="back" onClick={voltarEtapa}>
            Voltar
          </Button>,
          <Button key="validate" loading={loading} onClick={validarDados}>
            Validar Dados
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            loading={loading}
            onClick={handleExecutarComSucesso}
            disabled={Boolean(validacao && (validacao.validacao.invalidos > 0 || validacao.validacao.duplicatas > 0))}
          >
            Executar Importação
          </Button>,
        ];
      
      case 'concluido':
        return [
          <Button key="close" type="primary" onClick={handleClose}>
            Fechar
          </Button>,
        ];
      
      default:
        return [];
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={open}
      onCancel={handleClose}
      footer={getFooterButtons()}
      width={etapaAtual === 'revisao' ? 1400 : 800}
      style={{ top: 20 }}
      maskClosable={false}
    >
      {etapaAtual === 'upload' && renderEtapaUpload()}
      {etapaAtual === 'processando' && renderEtapaProcessando()}
      {etapaAtual === 'revisao' && renderEtapaRevisao()}
      {(etapaAtual === 'validando' || etapaAtual === 'importando') && renderEtapaProcesso()}
      {etapaAtual === 'concluido' && renderEtapaConcluido()}
    </Modal>
  );
};

export default NovaImportacaoLotePDFModal;
