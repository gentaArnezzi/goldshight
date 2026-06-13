'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { MODEL_COLORS, MODEL_LABELS } from '@/lib/types';

interface DirectionAccuracyProps {
  data: Array<{
    model: string;
    da: number;
    label: string;
  }>;
}

export default function DirectionAccuracy({ data }: DirectionAccuracyProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: 'oklch(0.65 0.02 80)' }}
            stroke="oklch(0.25 0.01 250)"
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            domain={[0, 1]}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: 'oklch(0.85 0.02 80)' }}
            stroke="oklch(0.25 0.01 250)"
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.16 0.005 250)',
              border: '1px solid oklch(0.25 0.01 250)',
              borderRadius: '12px',
              padding: '12px',
            }}
            formatter={((value: unknown) => [`${(Number(value) * 100).toFixed(1)}%`, 'Direction Accuracy']) as never}
          />
          <ReferenceLine x={0.5} stroke="oklch(0.40 0.01 250)" strokeDasharray="4 4" label={{ value: "50%", fill: "oklch(0.5 0.02 80)", fontSize: 10 }} />
          <Bar dataKey="da" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, index) => {
              const colorKey = entry.model.toLowerCase();
              const color = MODEL_COLORS[colorKey] || 'oklch(0.5 0.02 80)';
              return <Cell key={index} fill={color} opacity={0.8} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
