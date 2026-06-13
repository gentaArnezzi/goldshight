'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MODEL_COLORS } from '@/lib/types';

interface ResidualPlotProps {
  data: Array<{
    predicted: number;
    residual: number;
  }>;
  modelName: string;
  modelKey: string;
}

export default function ResidualPlot({ data, modelName, modelKey }: ResidualPlotProps) {
  const color = MODEL_COLORS[modelKey] || '#8884d8';

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{modelName}</h4>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" />
            <XAxis
              type="number"
              dataKey="predicted"
              tick={{ fontSize: 9, fill: 'oklch(0.65 0.02 80)' }}
              stroke="oklch(0.25 0.01 250)"
              tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              name="Predicted"
              label={{ value: "Predicted", position: "bottom", style: { fill: 'oklch(0.65 0.02 80)', fontSize: 10 } }}
            />
            <YAxis
              type="number"
              dataKey="residual"
              tick={{ fontSize: 9, fill: 'oklch(0.65 0.02 80)' }}
              stroke="oklch(0.25 0.01 250)"
              tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              name="Residual"
              label={{ value: "Residual", angle: -90, position: "insideLeft", style: { fill: 'oklch(0.65 0.02 80)', fontSize: 10 } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.16 0.005 250)',
                border: '1px solid oklch(0.25 0.01 250)',
                borderRadius: '12px',
                padding: '12px',
              }}
              formatter={((value: unknown) => `${(Number(value) * 100).toFixed(3)}%`) as never}
            />
            <ReferenceLine y={0} stroke="oklch(0.40 0.01 250)" strokeDasharray="4 4" />
            <Scatter data={data} fill={color} opacity={0.4} r={2} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
