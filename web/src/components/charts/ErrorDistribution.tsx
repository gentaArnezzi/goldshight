'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MODEL_COLORS, MODEL_LABELS } from '@/lib/types';

interface ErrorDistributionProps {
  predictions: Array<{
    errArimax?: number;
    errXgboost: number;
    errLstm: number;
  }>;
  showArimax?: boolean;
}

export default function ErrorDistribution({ predictions, showArimax = true }: ErrorDistributionProps) {
  // Create histogram bins for each model
  const binEdges = [-0.10, -0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08, 0.10];
  const models = showArimax
    ? (['arimax', 'xgboost', 'lstm'] as const)
    : (['xgboost', 'lstm'] as const);

  function getBinLabel(lower: number, upper: number): string {
    return `${(lower * 100).toFixed(0)}% to ${(upper * 100).toFixed(0)}%`;
  }

  function histogram(values: number[]): number[] {
    const counts = new Array(binEdges.length - 1).fill(0);
    for (const v of values) {
      for (let i = 0; i < binEdges.length - 1; i++) {
        if (v >= binEdges[i] && v < binEdges[i + 1]) {
          counts[i]++;
          break;
        }
      }
      if (v >= binEdges[binEdges.length - 1]) counts[counts.length - 1]++;
      if (v < binEdges[0]) counts[0]++;
    }
    return counts;
  }

  const errorsMap: Record<string, number[]> = {};
  for (const model of models) {
    const key = `err${model.charAt(0).toUpperCase() + model.slice(1)}` as keyof typeof predictions[0];
    errorsMap[model] = predictions.map((p) => (p[key] as number) || 0);
  }

  const chartData = binEdges.slice(0, -1).map((lower, i) => {
    const upper = binEdges[i + 1];
    const row: Record<string, string | number> = {
      bin: getBinLabel(lower, upper),
    };
    for (const model of models) {
      row[model] = histogram(errorsMap[model])[i];
    }
    return row;
  });

  const modelColors: Record<string, string> = {
    arimax: MODEL_COLORS.arimax,
    xgboost: MODEL_COLORS.xgboost,
    lstm: MODEL_COLORS.lstm,
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 9, fill: 'oklch(0.65 0.02 80)' }}
            stroke="oklch(0.25 0.01 250)"
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'oklch(0.65 0.02 80)' }}
            stroke="oklch(0.25 0.01 250)"
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: 'oklch(0.65 0.02 80)', fontSize: 10 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.16 0.005 250)',
              border: '1px solid oklch(0.25 0.01 250)',
              borderRadius: '12px',
              padding: '12px',
            }}
          />
          {models.map((model) => (
            <Bar
              key={model}
              dataKey={model}
              name={MODEL_LABELS[model]}
              fill={modelColors[model]}
              opacity={0.75}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
