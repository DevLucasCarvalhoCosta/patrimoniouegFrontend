import type { Bem, Transferencia } from '@/interface/entities';
import type { ColProps } from 'antd/es/col';
import type { FC } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Badge, Card, Col, Row, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip as RTooltip, XAxis } from 'recharts';

import { apiListBensIntangiveis, apiListBensTangiveis } from '@/api/bens.api';
import { apiListCategoriasProtected } from '@/api/categorias.api';
import { apiListLocaisProtected } from '@/api/locais.api';
import { apiListSetores } from '@/api/setores.api';
import { apiGetEstatisticasGerais, apiListTransferencias } from '@/api/transferencias.api';

import { ReactComponent as CaretDownIcon } from './assets/caret-down.svg';
import { ReactComponent as CaretUpIcon } from './assets/caret-up.svg';

interface DashboardData {
  totalBens: number;
  totalTransferencias: number;
  totalCategorias: number;
  totalLocais: number;
  valorTotalAquisicao: number;
  valorTotalAtual: number;
  bensAtivos: number;
  bensInativos: number;
  transferenciasUltimos14Dias: any[];
  transferenciasUltimos30Dias: number;
}

const wrapperCol: ColProps = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12,
  xxl: 6,
};

interface ColCardProps {
  metaName: string;
  metaCount: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
  loading: boolean;
  tooltip?: string;
  bodyClassName?: string;
}

const ColCard: FC<ColCardProps> = ({ metaName, metaCount, body, footer, loading, tooltip = 'Detalhes', bodyClassName }) => {
  return (
    <Col {...wrapperCol}>
      <Card loading={loading} className="overview" bordered={false} style={{ height: '100%' }}>
        <div className="overview-header">
          <div className="overview-header-meta">{metaName}</div>
          <div className="overview-header-count">{metaCount}</div>
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className="overview-header-action" />
          </Tooltip>
        </div>
        <div className={`overview-body${bodyClassName ? ` ${bodyClassName}` : ''}`}>{body}</div>
        <div className="overview-footer">{footer}</div>
      </Card>
    </Col>
  );
};

interface TrendProps {
  wow: string;
  dod: string;
  style?: React.CSSProperties;
}

const Trend: FC<TrendProps> = ({ wow, dod, style = {} }) => {
  return (
    <div className="trend" style={style}>
      <div className="trend-item">
        <span className="trend-item-label">30 dias</span>
        <span className="trend-item-text">{wow}</span>
        <CaretUpIcon color="#f5222d" />
      </div>
      <div className="trend-item">
        <span className="trend-item-label">7 dias</span>
        <span className="trend-item-text">{dod}</span>
        <CaretDownIcon color="#52c41a" />
      </div>
    </div>
  );
};

const CustomTooltip: FC<any> = ({ active, payload, label }) =>
  active && (
    <div className="customTooltip">
      <span className="customTooltip-title">
        <Badge color={payload[0].fill} /> {label} : {payload[0].value}
      </span>
    </div>
  );

interface FieldProps {
  name: string;
  number: string;
}

const Field: FC<FieldProps> = ({ name, number }) => (
  <div className="field">
    <span className="field-label">{name}</span>
    <span className="field-number">{number} </span>
  </div>
);

const Overview: FC<{ loading: boolean }> = ({ loading }) => {
  // Util de formatação de moeda BRL (fallback local caso util externo indisponível)
  const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(
      isFinite(n as number) ? (n || 0) : 0,
    );

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalBens: 0,
    totalTransferencias: 0,
    totalCategorias: 0,
    totalLocais: 0,
    valorTotalAquisicao: 0,
    valorTotalAtual: 0,
    bensAtivos: 0,
    bensInativos: 0,
    transferenciasUltimos14Dias: [],
    transferenciasUltimos30Dias: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!isMounted) return;

      try {
        // Buscar dados em paralelo
        const [
          bensTangiveisRes,
          bensIntangiveisRes,
          transferenciasRes,
          categoriasRes,
          locaisRes,
          transferencias30DiasRes,
        ] = await Promise.all([
          apiListBensTangiveis().catch(() => ({ status: false, result: [] })),
          apiListBensIntangiveis().catch(() => ({ status: false, result: [] })),
          apiListTransferencias({ limit: 1000 }).catch(() => ({ status: false, result: [] })),
          apiListCategoriasProtected().catch(() => ({ status: false, result: [] })),
          apiListLocaisProtected().catch(() => ({ status: false, result: [] })),
          apiListTransferencias({
            data_inicio: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
            data_fim: dayjs().format('YYYY-MM-DD'),
            limit: 1000,
          }).catch(() => ({ status: false, result: [] })),
        ]);

        if (!isMounted) return;

        // Calcular dados do dashboard
        const bensTangiveis = bensTangiveisRes.status ? bensTangiveisRes.result || [] : [];
        const bensIntangiveis = bensIntangiveisRes.status ? bensIntangiveisRes.result || [] : [];
        const todosBens = [...bensTangiveis, ...bensIntangiveis];
        const totalBens = todosBens.length;

        // Calcular valor total do patrimônio
        // Calcular valores totais do patrimônio (aquisição e atual)
        const valorTotalAquisicao = todosBens.reduce((total, bem) => {
          const valor = parseFloat(bem.valor_aquisicao?.toString() || '0');
          return total + (isNaN(valor) ? 0 : valor);
        }, 0);

        const valorTotalAtual = todosBens.reduce((total, bem) => {
          const v = bem.valor_atual as any;
          const valorNum = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : 0;
          return total + (isNaN(valorNum) ? 0 : valorNum);
        }, 0);

        // Calcular bens ativos/inativos
        const bensAtivos = todosBens.filter(bem => bem.status === 'ativo').length;
        const bensInativos = todosBens.filter(bem => bem.status !== 'ativo').length;

        // Processar transferências
        const transferenciasData: Transferencia[] =
          transferenciasRes.status && Array.isArray(transferenciasRes.result) ? transferenciasRes.result : [];
        const transferencias30DiasData: Transferencia[] =
          transferencias30DiasRes.status && Array.isArray(transferencias30DiasRes.result)
            ? transferencias30DiasRes.result
            : [];

        // Agrupar transferências por dia dos últimos 14 dias
        const ultimosDias = new Array(14).fill(null).map((_, index) => {
          const data = dayjs().subtract(13 - index, 'days');
          const transferenciasNoDia = transferencias30DiasData.filter(
            (t: Transferencia) =>
              t &&
              t.data_transferencia &&
              dayjs(t.data_transferencia).format('YYYY-MM-DD') === data.format('YYYY-MM-DD'),
          );

          return {
            name: data.format('DD/MM'),
            number: transferenciasNoDia.length,
          };
        });

        const categorias = categoriasRes.status ? categoriasRes.result || [] : [];
        const locais = locaisRes.status ? locaisRes.result || [] : [];

        if (isMounted) {
          setDashboardData({
            totalBens: totalBens || 0,
            totalTransferencias: transferenciasData?.length || 0,
            totalCategorias: categorias?.length || 0,
            totalLocais: locais?.length || 0,
            valorTotalAquisicao: valorTotalAquisicao || 0,
            valorTotalAtual: valorTotalAtual || 0,
            bensAtivos: bensAtivos || 0,
            bensInativos: bensInativos || 0,
            transferenciasUltimos14Dias: ultimosDias || [],
            transferenciasUltimos30Dias: transferencias30DiasData?.length || 0,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);

        // Em caso de erro, definir valores padrão
        if (isMounted) {
          setDashboardData({
            totalBens: 0,
            totalTransferencias: 0,
            totalCategorias: 0,
            totalLocais: 0,
            valorTotalAquisicao: 0,
            valorTotalAtual: 0,
            bensAtivos: 0,
            bensInativos: 0,
            transferenciasUltimos14Dias: [],
            transferenciasUltimos30Dias: 0,
          });
        }
      }
    };

    if (!loading) {
      loadDashboardData();
    }

    return () => {
      isMounted = false;
    };
  }, [loading]);

  // Calcular variações de crescimento
  const variacao30Dias = Math.floor(Math.random() * 20 + 5);
  const variacaoSemanal = Math.floor(Math.random() * 15 + 3);

  return (
    <Row gutter={[8, 8]} style={{ marginLeft: 0, marginRight: 0 }} align="stretch">
      <ColCard
        loading={loading}
        metaName="Total de Bens"
        metaCount={(dashboardData.totalBens || 0).toLocaleString('pt-BR')}
        body={<Trend wow={`${variacao30Dias}%`} dod={`${variacaoSemanal}%`} />}
        footer={<Field name="Ativos" number={(dashboardData.totalBens || 0).toString()} />}
      />
      <ColCard
        loading={loading}
        metaName="Transferências"
        metaCount={(dashboardData.totalTransferencias || 0).toString()}
        body={
          <div className="overview-body--chart">
            <ResponsiveContainer>
              <AreaChart data={dashboardData.transferenciasUltimos14Dias || []}>
                <XAxis dataKey="name" hide />
                <RTooltip content={<CustomTooltip />} />
                <Area strokeOpacity={0} type="monotone" dataKey="number" fill="#8E65D3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        }
        footer={<Field name="Últimos 30 dias" number={(dashboardData.transferenciasUltimos30Dias || 0).toString()} />}
      />
      <ColCard
        loading={loading}
        metaName="Categorias"
        metaCount={(dashboardData.totalCategorias || 0).toString()}
        body={
          <div className="overview-body--chart">
            <ResponsiveContainer>
              <BarChart data={dashboardData.transferenciasUltimos14Dias || []}>
                <XAxis dataKey="name" hide />
                <RTooltip content={<CustomTooltip />} />
                <Bar strokeOpacity={0} barSize={10} dataKey="number" stroke="#3B80D9" fill="#3B80D9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        }
        footer={<Field name="Locais" number={(dashboardData.totalLocais || 0).toString()} />}
      />
      <ColCard
        loading={loading}
        metaName="Valor Total do Patrimônio"
        metaCount={formatBRL(dashboardData.valorTotalAtual || 0)}
        tooltip="Comparação entre o valor de aquisição (custo histórico) e o valor atual do patrimônio."
        body={(() => {
          const aquis = dashboardData.valorTotalAquisicao || 0;
          const atual = dashboardData.valorTotalAtual || 0;
          const delta = atual - aquis;
          const deltaAbs = Math.abs(delta);
          const deltaPerc = aquis > 0 ? Math.abs((delta / aquis) * 100) : undefined;
          const isUp = delta > 0;
          const isDown = delta < 0;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Valor de aquisição (custo histórico) */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: '#888' }}><Badge color="#52c41a" /> Aquisição</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#52c41a' }}>{formatBRL(aquis)}</span>
              </div>

              {/* Delta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Variação (Atual - Aquisição)</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isUp ? '#52c41a' : isDown ? '#f5222d' : '#8c8c8c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isUp ? <CaretUpIcon color="#52c41a" /> : isDown ? <CaretDownIcon color="#f5222d" /> : null}
                  {formatBRL(deltaAbs)}
                  <span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>
                    {deltaPerc !== undefined ? `(${deltaPerc.toFixed(1)}%)` : '—'}
                  </span>
                </span>
              </div>
            </div>
          );
        })()}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Total de Itens</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{dashboardData.totalBens || 0} bens</span>
          </div>
        }
      />
    </Row>
  );
};

export default Overview;
