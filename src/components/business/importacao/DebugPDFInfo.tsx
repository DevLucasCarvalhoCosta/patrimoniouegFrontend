import type { DadosPDFExtraidos } from '@/interface/importacao';

import { FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Divider, Typography } from 'antd';
import React, { useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  dadosExtraidos: DadosPDFExtraidos;
}

export const DebugPDFInfo: React.FC<Props> = ({ dadosExtraidos }) => {
  const [showFullText, setShowFullText] = useState(false);

  const textoTruncado = dadosExtraidos.texto_extraido.substring(0, 1000);
  const precisouTruncar = dadosExtraidos.texto_extraido.length > 1000;

  return (
    <Card 
      title="Informações de Debug" 
      style={{ marginBottom: 16 }}
    >
      <Collapse>
        <Panel header="Texto Extraído do PDF" key="texto">
          <div style={{ 
            maxHeight: 400, 
            overflow: 'auto', 
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 16,
            marginBottom: 12
          }}>
            <pre style={{ 
              margin: 0, 
              fontSize: 12, 
              lineHeight: 1.5,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {showFullText ? dadosExtraidos.texto_extraido : textoTruncado}
            </pre>
            {precisouTruncar && !showFullText && (
              <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
                <Button 
                  type="link" 
                  size="small" 
                  icon={<InfoCircleOutlined />}
                  onClick={() => setShowFullText(true)}
                >
                  Mostrar texto completo ({dadosExtraidos.texto_extraido.length.toLocaleString()} caracteres)
                </Button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              📄 {dadosExtraidos.texto_extraido.length.toLocaleString()} caracteres extraídos
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              🔍 {dadosExtraidos.estatisticas.total_bens} bens detectados
            </Text>
          </div>
        </Panel>
        
        <Panel header="Estatísticas de Extração" key="stats">
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 14 }}>
                📊 Resumo da Extração:
              </Text>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16,
              marginBottom: 16
            }}>
              <div style={{ 
                padding: 12, 
                borderRadius: 6,
                border: '1px solid #d9d9d9'
              }}>
                <Text strong>Total de bens:</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {dadosExtraidos.estatisticas.total_bens}
                </div>
              </div>
            </div>

            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                ✅ Campos com dados preenchidos:
              </Text>
              <div style={{ paddingLeft: 16 }}>
                <div style={{ marginBottom: 4 }}>
                  <Text>🏷️ Número de patrimônio: </Text>
                  <Text strong>
                    {dadosExtraidos.estatisticas.campos_preenchidos.numero_patrimonio}
                  </Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Text>📝 Nome do bem: </Text>
                  <Text strong>
                    {dadosExtraidos.estatisticas.campos_preenchidos.nome_bem}
                  </Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Text>🏭 Marca: </Text>
                  <Text strong>
                    {dadosExtraidos.estatisticas.campos_preenchidos.marca}
                  </Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Text>🔧 Modelo: </Text>
                  <Text strong>
                    {dadosExtraidos.estatisticas.campos_preenchidos.modelo}
                  </Text>
                </div>
                <div>
                  <Text>🔢 Número de série: </Text>
                  <Text strong>
                    {dadosExtraidos.estatisticas.campos_preenchidos.numero_serie}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        
        <Panel header="Dicas para Melhorar Extração" key="dicas">
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 20 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                ⚠️ Se poucos dados foram extraídos:
              </Title>
              <div style={{ paddingLeft: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Verifique se o PDF contém <strong>texto selecionável</strong> (não é uma imagem escaneada)</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Certifique-se de que é um <strong>relatório patrimonial da UEG</strong> no formato padrão</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Verifique se o PDF não está <strong>protegido ou criptografado</strong></Text>
                </div>
                <div>
                  <Text>• Confirme que o arquivo tem o cabeçalho <strong>"Sistema de Patrimônio Mobiliário"</strong></Text>
                </div>
              </div>
            </div>
            
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                🎯 Padrões reconhecidos pelo sistema:
              </Title>
              <div style={{ paddingLeft: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Números de patrimônio com <strong>6 ou mais dígitos</strong></Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Seções iniciadas com <strong>"SETOR:", "DEPARTAMENTO:", "LOCAL:"</strong>, etc.</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Linhas com padrão: <strong>[PATRIMÔNIO] [DESCRIÇÃO] [OUTROS DADOS]</strong></Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text>• Valores em formato <strong>R$ 0.000,00</strong></Text>
                </div>
                <div>
                  <Text>• Informações de marca e modelo após <strong>"Marca:" e "Modelo:"</strong></Text>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default DebugPDFInfo;
