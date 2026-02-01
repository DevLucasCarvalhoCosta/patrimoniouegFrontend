import type { Bem, ExecutarTransferenciaParams, Local } from '@/interface/entities';
import type { FC } from 'react';

import { EnvironmentOutlined, ExclamationCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { Divider, Form, Input, message, Modal, Select, Space, Tag, theme, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { apiListLocaisProtected } from '@/api/locais.api';
import { apiExecutarTransferencia } from '@/api/transferencias.api';
import { useBensRefreshTrigger } from '@/hooks/useBensRefresh';
import { addNotification } from '@/utils/notifications';

interface TransferenciaModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  bem: Bem | null;
}

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

const TransferenciaModal: FC<TransferenciaModalProps> = ({ open, onCancel, onSuccess, bem }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locais, setLocais] = useState<Local[]>([]);
  const [loadingLocais, setLoadingLocais] = useState(false);
  const { token } = theme.useToken();

  // Hook para notificar outras páginas sobre mudanças nos bens
  const { triggerRefresh } = useBensRefreshTrigger();

  useEffect(() => {
    if (open && bem) {
      form.resetFields();
      loadLocais();
    }
  }, [open, bem, form]);

  const loadLocais = async () => {
    setLoadingLocais(true);

    try {
      const { status, result } = await apiListLocaisProtected();

      if (status && result) {
        // Filtrar o local atual do bem
        const locaisFiltrados = (result as Local[]).filter(
          local => local.cod_local !== bem?.cod_local && local.ativo !== false,
        );

        setLocais(locaisFiltrados);
      }
    } catch (error) {
      message.error('Erro ao carregar locais');
    } finally {
      setLoadingLocais(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!bem) return;

    Modal.confirm({
      title: 'Confirmar Transferência',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Tem certeza que deseja transferir este bem?</p>
          <div style={{ margin: '12px 0', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p>
              <strong>Bem:</strong> {bem.nome_bem}
            </p>
            <p>
              <strong>Nº Patrimônio:</strong> {bem.numero_patrimonio}
            </p>
            <p>
              <strong>De:</strong> {bem.local?.nome_local}
            </p>
            <p>
              <strong>Para:</strong> {locais.find(l => l.cod_local === values.cod_local_destino)?.nome_local}
            </p>
            {values.motivo && (
              <p>
                <strong>Motivo:</strong> {values.motivo}
              </p>
            )}
          </div>
        </div>
      ),
      okText: 'Confirmar Transferência',
      cancelText: 'Cancelar',
      onOk: () => executeTransfer(values),
    });
  };

  const executeTransfer = async (values: any) => {
    if (!bem) return;

    setLoading(true);

    try {
      const params: ExecutarTransferenciaParams = {
        cod_bem: bem.cod_bem,
        cod_local_destino: values.cod_local_destino,
        motivo: values.motivo?.trim() || undefined,
        observacoes: values.observacoes?.trim() || undefined,
      };

      const { status, result } = await apiExecutarTransferencia(params);

      if (status) {
        message.success('Transferência realizada com sucesso!');

        // Encontrar o nome do local de destino
        const localDestino = locais.find(l => l.cod_local === values.cod_local_destino);
        const localDestinoNome = localDestino?.nome_local || 'Local desconhecido';

        addNotification({
          title: 'Transferência de bem realizada',
          operation: 'transfer',
          entity: 'bem',
          entityId: bem.cod_bem,
          description: `Bem "${bem.nome_bem}" (Patrimônio: ${bem.numero_patrimonio}) foi transferido para ${localDestinoNome}`,
        });

        form.resetFields();

        // Notificar outras páginas para atualizar os dados dos bens
        triggerRefresh();

        onSuccess();
      } else {
        throw new Error('Falha na transferência');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.erro || error?.message || 'Erro ao executar transferência';

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const localAtual = bem?.local;
  const localDestino = form.getFieldValue('cod_local_destino');
  const localDestinoObj = locais.find(l => l.cod_local === localDestino);

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined />
          Executar Transferência de Bem
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      okText="Executar Transferência"
      cancelText="Cancelar"
      destroyOnClose
    >
      {bem && (
        <Form form={form} layout="vertical" onFinish={handleSubmit} preserve={false}>
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>Informações do Bem</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Nome: </Text>
                <Text>{bem.nome_bem}</Text>
              </div>
              <div>
                <Text strong>Nº Patrimônio: </Text>
                <Text code>{bem.numero_patrimonio}</Text>
              </div>
              {bem.estado_conservacao && (
                <div>
                  <Text strong>Estado de Conservação: </Text>
                  <Tag
                    color={
                      bem.estado_conservacao === 'Excelente'
                        ? 'green'
                        : bem.estado_conservacao === 'Bom'
                        ? 'blue'
                        : bem.estado_conservacao === 'Regular'
                        ? 'orange'
                        : 'red'
                    }
                  >
                    {bem.estado_conservacao}
                  </Tag>
                </div>
              )}
            </Space>
          </div>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Title level={5}>
              <EnvironmentOutlined /> Local Atual
            </Title>
            <div
              style={{
                padding: 12,
                background: token.colorFillQuaternary,
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <Text strong>{localAtual?.nome_local || 'Local não definido'}</Text>
              {localAtual?.setor && (
                <div>
                  <Text type="secondary">
                    Setor: {localAtual.setor.nome_setor}
                    {localAtual.setor.sigla && ` (${localAtual.setor.sigla})`}
                  </Text>
                </div>
              )}
            </div>
          </div>

          <Form.Item
            name="cod_local_destino"
            label={
              <span>
                <EnvironmentOutlined /> Local de Destino
              </span>
            }
            rules={[{ required: true, message: 'Selecione o local de destino' }]}
          >
            <Select
              placeholder="Selecione o local de destino"
              loading={loadingLocais}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
              }
            >
              {locais.map(local => (
                <Option key={local.cod_local} value={local.cod_local}>
                  <div>
                    <div>
                      <strong>{local.nome_local}</strong>
                    </div>
                    {local.setor && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {local.setor.nome_setor}
                        {local.setor.sigla && ` (${local.setor.sigla})`}
                      </div>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {localDestinoObj && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: token.colorPrimaryBg,
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorPrimaryBorder}`,
              }}
            >
              <Text strong>Destino Selecionado: </Text>
              <Text>{localDestinoObj.nome_local}</Text>
              {localDestinoObj.setor && (
                <div>
                  <Text type="secondary">
                    Setor: {localDestinoObj.setor.nome_setor}
                    {localDestinoObj.setor.sigla && ` (${localDestinoObj.setor.sigla})`}
                  </Text>
                </div>
              )}
            </div>
          )}

          <Form.Item name="motivo" label="Motivo da Transferência">
            <Input placeholder="Ex: Reorganização do espaço, manutenção, etc. (opcional)" />
          </Form.Item>

          <Form.Item name="observacoes" label="Observações">
            <TextArea rows={3} placeholder="Observações adicionais sobre a transferência (opcional)" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default TransferenciaModal;
