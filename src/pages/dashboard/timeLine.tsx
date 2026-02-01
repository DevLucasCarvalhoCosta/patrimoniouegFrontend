import type { Bem, Transferencia } from '@/interface/entities';
import type { FC } from 'react';

import { Badge, Card } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Brush, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { apiListBensIntangiveis, apiListBensTangiveis } from '@/api/bens.api';
import { apiListTransferencias } from '@/api/transferencias.api';

const CustomTooltip: FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="customTooltip">
        <span className="customTooltip-title">{label}</span>
        <ul className="customTooltip-content">
          {payload.map((entry: any, index: number) => (
            <li key={index}>
              <Badge color={entry.stroke} />
              {entry.dataKey === 'transferencias' ? 'Transferências' : 'Bens Cadastrados'} {entry.value}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
};

const TimeLine: FC<{ loading: boolean }> = ({ loading }) => {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const loadTimelineData = async () => {
      try {
        // Buscar todas as transferências e bens
        const [transferenciasRes, bensTangiveisRes, bensIntangiveisRes] = await Promise.all([
          apiListTransferencias({ limit: 50000 }).catch(err => {
            console.error('Erro ao buscar transferências:', err);

            return { status: false, result: [] };
          }),
          apiListBensTangiveis().catch(() => ({ status: false, result: [] })),
          apiListBensIntangiveis().catch(() => ({ status: false, result: [] })),
        ]);

        if (!isMounted.current) return;

        // A API retorna as transferências diretamente no result (Array)
        const todasTransferencias: Transferencia[] = transferenciasRes.status
          ? Array.isArray(transferenciasRes.result)
            ? transferenciasRes.result
            : []
          : [];

        const todosBens: Bem[] = [
          ...(bensTangiveisRes.status ? bensTangiveisRes.result || [] : []),
          ...(bensIntangiveisRes.status ? bensIntangiveisRes.result || [] : []),
        ];

        // Filtrar no frontend pelos últimos 20 dias
        const hoje = dayjs();

        // Gerar dados para os últimos 20 dias
        const dadosTimeline = new Array(20).fill(null).map((_, index) => {
          const data = hoje.subtract(19 - index, 'days');
          const dataFormatada = data.format('YYYY-MM-DD');

          // Contar transferências realizadas neste dia
          const transferenciasNoDia = todasTransferencias.filter(t => {
            if (!t || !t.data_transferencia) return false;
            const dataTransferencia = dayjs(t.data_transferencia).format('YYYY-MM-DD');

            return dataTransferencia === dataFormatada;
          }).length;

          // Contar bens cadastrados neste dia
          const bensCadastradosNoDia = todosBens.filter(bem => {
            if (!bem || !bem.data_criacao) return false;
            const dataCriacao = dayjs(bem.data_criacao).format('YYYY-MM-DD');

            return dataCriacao === dataFormatada;
          }).length;

          return {
            name: data.format('DD/MM'),
            transferencias: transferenciasNoDia,
            bens: bensCadastradosNoDia,
          };
        });

        if (isMounted.current) {
          setTimelineData(dadosTimeline);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da timeline:', error);

        if (isMounted.current) {
          const dadosVazios = new Array(20).fill(null).map((_, index) => ({
            name: dayjs()
              .subtract(19 - index, 'days')
              .format('DD/MM'),
            transferencias: 0,
            bens: 0,
          }));

          setTimelineData(dadosVazios);
        }
      }
    };

    if (!loading) {
      loadTimelineData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [loading]);

  return (
    <Card
      loading={loading}
      title="Atividade dos Últimos 20 Dias"
      style={{ marginTop: 12, width: '100%' }}
      bodyStyle={{ overflowX: 'hidden' }}
    >
      <ResponsiveContainer height={400}>
        <LineChart data={timelineData} syncId="anyId">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="transferencias" stroke="#3F90F7" />
          <Line type="monotone" dataKey="bens" stroke="#61BE82" />
          <Brush dataKey="name" fill="#13c2c2" />
          <Legend
            verticalAlign="top"
            height={40}
            formatter={value => (value === 'transferencias' ? 'Transferências' : 'Bens Cadastrados')}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TimeLine;
