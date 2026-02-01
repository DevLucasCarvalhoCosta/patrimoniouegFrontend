import type { ColProps } from 'antd/es/col';
import type { FC } from 'react';

import { Badge, Card, Col, List, Radio, Row } from 'antd';
import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { apiListBensIntangiveis, apiListBensTangiveis } from '@/api/bens.api';
import { apiListCategoriasProtected } from '@/api/categorias.api';
import { apiListLocaisProtected } from '@/api/locais.api';

type DataType = 'categorias' | 'locais' | 'status';

interface DataItem {
  name: string;
  value: number;
}

interface Data {
  categorias: DataItem[];
  locais: DataItem[];
  status: DataItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#E36E7E', '#8F66DE'];

const wrapperCol: ColProps = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 12,
  xxl: 12,
};

const SalePercent: FC<{ loading: boolean }> = ({ loading }) => {
  const [dataType, setDataType] = useState<DataType>('categorias');
  const [data, setData] = useState<Data>({
    categorias: [],
    locais: [],
    status: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [bensTangiveisRes, bensIntangiveisRes, categoriasRes, locaisRes] = await Promise.all([
          apiListBensTangiveis().catch(() => ({ status: false, result: [] })),
          apiListBensIntangiveis().catch(() => ({ status: false, result: [] })),
          apiListCategoriasProtected().catch(() => ({ status: false, result: [] })),
          apiListLocaisProtected().catch(() => ({ status: false, result: [] })),
        ]);

        if (!isMounted) return;

        const todosBens = [
          ...(bensTangiveisRes.status ? bensTangiveisRes.result || [] : []),
          ...(bensIntangiveisRes.status ? bensIntangiveisRes.result || [] : []),
        ];

        const categorias = categoriasRes.status ? categoriasRes.result || [] : [];
        const locais = locaisRes.status ? locaisRes.result || [] : [];

        // Agrupar por categorias
        const bensPorCategoria = categorias
          .map((categoria: any) => ({
            name: categoria.nome_categoria || 'Sem categoria',
            value: todosBens.filter(bem => bem && bem.cod_categoria === categoria.cod_categoria).length,
          }))
          .filter((item: DataItem) => item.value > 0);

        // Agrupar por locais (top 6)
        const bensPorLocal = locais
          .map((local: any) => ({
            name: local.nome_local || 'Sem local',
            value: todosBens.filter(bem => bem && bem.cod_local === local.cod_local).length,
          }))
          .filter((item: DataItem) => item.value > 0)
          .sort((a: DataItem, b: DataItem) => b.value - a.value)
          .slice(0, 6);

        // Agrupar por status
        const statusCount: { [key: string]: number } = {};

        todosBens.forEach(bem => {
          if (bem && bem.status) {
            const status = bem.status || 'Indefinido';

            statusCount[status] = (statusCount[status] || 0) + 1;
          }
        });

        const bensPorStatus = Object.entries(statusCount).map(([status, count]) => ({
          name: status,
          value: count,
        }));

        if (isMounted) {
          setData({
            categorias: bensPorCategoria,
            locais: bensPorLocal,
            status: bensPorStatus,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);

        if (isMounted) {
          setData({
            categorias: [],
            locais: [],
            status: [],
          });
        }
      }
    };

    if (!loading) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [loading]);

  return (
    <Card
      className="salePercent"
      title="Distribuição do Patrimônio"
      loading={loading}
      style={{ height: '400px' }}
      bodyStyle={{ height: '320px', padding: '12px 24px' }}
      extra={
        <Radio.Group value={dataType} onChange={(e: any) => setDataType(e.target.value)} buttonStyle="solid">
          <Radio.Button value="categorias">Por Categoria</Radio.Button>
          <Radio.Button value="locais">Por Local</Radio.Button>
          <Radio.Button value="status">Por Status</Radio.Button>
        </Radio.Group>
      }
    >
      <Row gutter={16} style={{ height: '100%', margin: 0 }}>
        <Col {...wrapperCol} style={{ paddingLeft: 8, paddingRight: 8 }}>
          <ResponsiveContainer height={280}>
            <PieChart>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload[0]) {
                    const { name, value } = payload[0];
                    const total = data[dataType].map(d => d.value).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';

                    return (
                      <span className="customTooltip">
                        {name} : {value} bens ({percent})
                      </span>
                    );
                  }

                  return null;
                }}
              />
              <Pie
                strokeOpacity={0}
                data={data[dataType]}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data[dataType].map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Col>
        <Col {...wrapperCol} style={{ paddingLeft: 8, paddingRight: 8 }}>
          <div style={{ height: '280px', overflowY: 'auto', overflowX: 'hidden' }}>
            <List<DataItem>
              bordered
              dataSource={data[dataType]}
              renderItem={(item: DataItem, index: number) => {
                const total = data[dataType].map(d => d.value).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) + '%' : '0%';

                return (
                  <List.Item>
                    <Badge color={COLORS[index % COLORS.length]} />
                    <span>{item.name}</span> | <span>{item.value} bens</span> <span>({percent})</span>
                  </List.Item>
                );
              }}
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default SalePercent;
