import type { MapeamentoCategoria, MapeamentoLocal } from '@/interface/importacao';
import type { FC } from 'react';

import {
  CheckOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Button, Card, Col, List, Progress, Row, Select, Space, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { aplicarMapeamentoCategoria, aplicarMapeamentoLocal, reprocessarNormalizacao } from '@/stores/importacao.store';

interface NormalizacaoMapeamentosProps {
  importacaoId: string;
}

const { Title, Text } = Typography;
const { Option } = Select;

const NormalizacaoMapeamentos: FC<NormalizacaoMapeamentosProps> = ({ importacaoId }) => {
  const dispatch = useDispatch();
  const { dadosNormalizacao, categorias, locais, loadingNormalizacao, importacaoAtual } = useSelector(
    (state: any) => state.importacao,
  );

  const [mapeamentosLocais, setMapeamentosLocais] = useState<{ [key: string]: number }>({});
  const [mapeamentosCategorias, setMapeamentosCategorias] = useState<{ [key: string]: number }>({});

  const handleReprocessar = () => {
    dispatch(reprocessarNormalizacao(importacaoId) as any);
  };

  const handleAplicarMapeamentoLocal = async (localOriginal: string, codLocal: number) => {
    try {
      await dispatch(
        aplicarMapeamentoLocal({
          importacaoId,
          mapeamento: { local_original: localOriginal, cod_local: codLocal },
        }) as any,
      ).unwrap();

      // Atualizar estado local
      setMapeamentosLocais(prev => ({ ...prev, [localOriginal]: codLocal }));
    } catch (error: any) {
      console.error('Erro ao aplicar mapeamento:', error);
    }
  };

  const handleAplicarMapeamentoCategoria = async (classeOriginal: string, codCategoria: number) => {
    try {
      await dispatch(
        aplicarMapeamentoCategoria({
          importacaoId,
          mapeamento: { classe_original: classeOriginal, cod_categoria: codCategoria },
        }) as any,
      ).unwrap();

      // Atualizar estado local
      setMapeamentosCategorias(prev => ({ ...prev, [classeOriginal]: codCategoria }));
    } catch (error: any) {
      console.error('Erro ao aplicar mapeamento:', error);
    }
  };

  const calcularProgresso = () => {
    if (!dadosNormalizacao) return 0;

    const totalProblemas = dadosNormalizacao.total_problemas;

    if (totalProblemas === 0) return 100;

    const locaisMapeados = dadosNormalizacao.mapeamentos_locais.filter((m: any) => m.cod_local).length;
    const categoriasMapeadas = dadosNormalizacao.mapeamentos_categorias.filter((m: any) => m.cod_categoria).length;
    const totalMapeados = locaisMapeados + categoriasMapeadas;

    return Math.round((totalMapeados / totalProblemas) * 100);
  };

  if (!dadosNormalizacao) {
    return (
      <div className="text-center py-8">
        <Text type="secondary">Carregando dados de normalização...</Text>
      </div>
    );
  }

  const progresso = calcularProgresso();
  const podeConfirmar = dadosNormalizacao.pode_confirmar;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <Card size="small">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <div>
              <Title level={5} className="mb-1">
                Progresso da Normalização
              </Title>
              <Text type="secondary">{dadosNormalizacao.total_problemas} problemas de mapeamento encontrados</Text>
            </div>
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={progresso}
              size={80 as any}
              status={podeConfirmar ? 'success' : 'normal'}
            />
          </Col>
          <Col>
            <Space direction="vertical">
              <Button icon={<ReloadOutlined />} onClick={handleReprocessar} loading={loadingNormalizacao} size="small">
                Reprocessar
              </Button>
              {podeConfirmar && <Badge status="success" text="Pronto para confirmar" />}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Status geral */}
      {podeConfirmar ? (
        <Alert
          message="Normalização completa!"
          description="Todos os mapeamentos foram resolvidos. A importação está pronta para ser confirmada."
          type="success"
          showIcon
          icon={<CheckOutlined />}
        />
      ) : (
        <Alert
          message="Mapeamentos pendentes"
          description="Alguns locais ou categorias precisam ser mapeados antes de confirmar a importação."
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      )}

      <Row gutter={16}>
        {/* Mapeamento de Locais */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                Mapeamento de Locais
                <Badge count={dadosNormalizacao.mapeamentos_locais.filter((m: any) => !m.cod_local).length} />
              </Space>
            }
            size="small"
          >
            <List
              dataSource={dadosNormalizacao.mapeamentos_locais}
              renderItem={(mapeamento: MapeamentoLocal) => (
                <List.Item className="border-b border-gray-100 last:border-b-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Text strong className="text-sm">
                          {mapeamento.local_original}
                        </Text>
                        <Badge
                          count={mapeamento.qtd_itens}
                          size="small"
                          className="ml-2"
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      </div>
                      {mapeamento.cod_local && <CheckOutlined className="text-green-500" />}
                    </div>

                    {!mapeamento.cod_local ? (
                      <Select
                        size="small"
                        placeholder="Selecionar local..."
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="children"
                        onChange={value => handleAplicarMapeamentoLocal(mapeamento.local_original, value)}
                        filterOption={(input, option) =>
                          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {locais.map((local: any) => (
                          <Option key={local.cod_local} value={local.cod_local}>
                            <div>
                              <div>{local.nome_local}</div>
                              {local.setor && (
                                <Text type="secondary" className="text-xs">
                                  {local.setor.nome_setor}
                                </Text>
                              )}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                        <Text className="text-green-700 text-sm">
                          ✓ Mapeado para: {locais.find((l: any) => l.cod_local === mapeamento.cod_local)?.nome_local}
                        </Text>
                      </div>
                    )}

                    {mapeamento.sugestoes && mapeamento.sugestoes.length > 0 && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-xs">
                          Sugestões:
                        </Text>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mapeamento.sugestoes.slice(0, 3).map((sugestao, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              type="dashed"
                              className="text-xs h-6"
                              onClick={() =>
                                handleAplicarMapeamentoLocal(mapeamento.local_original, sugestao.cod_local)
                              }
                            >
                              {sugestao.nome_local}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />

            {dadosNormalizacao.mapeamentos_locais.length === 0 && (
              <div className="text-center py-4">
                <CheckOutlined className="text-green-500 text-2xl mb-2" />
                <Text type="secondary">Todos os locais foram mapeados</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Mapeamento de Categorias */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TagOutlined />
                Mapeamento de Categorias
                <Badge count={dadosNormalizacao.mapeamentos_categorias.filter((m: any) => !m.cod_categoria).length} />
              </Space>
            }
            size="small"
          >
            <List
              dataSource={dadosNormalizacao.mapeamentos_categorias}
              renderItem={(mapeamento: MapeamentoCategoria) => (
                <List.Item className="border-b border-gray-100 last:border-b-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Text strong className="text-sm">
                          {mapeamento.classe_original}
                        </Text>
                        <Badge
                          count={mapeamento.qtd_itens}
                          size="small"
                          className="ml-2"
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      </div>
                      {mapeamento.cod_categoria && <CheckOutlined className="text-green-500" />}
                    </div>

                    {!mapeamento.cod_categoria ? (
                      <Select
                        size="small"
                        placeholder="Selecionar categoria..."
                        style={{ width: '100%' }}
                        showSearch
                        optionFilterProp="children"
                        onChange={value => handleAplicarMapeamentoCategoria(mapeamento.classe_original, value)}
                        filterOption={(input, option) =>
                          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {categorias.map((categoria: any) => (
                          <Option key={categoria.cod_categoria} value={categoria.cod_categoria}>
                            <div>
                              <div>{categoria.nome_categoria}</div>
                              {categoria.codigo_categoria && (
                                <Text type="secondary" className="text-xs">
                                  Código: {categoria.codigo_categoria}
                                </Text>
                              )}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                        <Text className="text-green-700 text-sm">
                          ✓ Mapeado para:{' '}
                          {categorias.find((c: any) => c.cod_categoria === mapeamento.cod_categoria)?.nome_categoria}
                        </Text>
                      </div>
                    )}

                    {mapeamento.sugestoes && mapeamento.sugestoes.length > 0 && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-xs">
                          Sugestões:
                        </Text>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mapeamento.sugestoes.slice(0, 3).map((sugestao, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              type="dashed"
                              className="text-xs h-6"
                              onClick={() =>
                                handleAplicarMapeamentoCategoria(mapeamento.classe_original, sugestao.cod_categoria)
                              }
                            >
                              {sugestao.nome_categoria}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />

            {dadosNormalizacao.mapeamentos_categorias.length === 0 && (
              <div className="text-center py-4">
                <CheckOutlined className="text-green-500 text-2xl mb-2" />
                <Text type="secondary">Todas as categorias foram mapeadas</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Ações globais */}
      <Card size="small">
        <div className="flex items-center justify-between">
          <div>
            <Title level={5} className="mb-1">
              Ações de Normalização
            </Title>
            <Text type="secondary">Execute o reprocessamento após aplicar os mapeamentos</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReprocessar} loading={loadingNormalizacao}>
              Reprocessar Normalização
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default NormalizacaoMapeamentos;
