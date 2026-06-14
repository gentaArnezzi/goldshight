'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { MODEL_COLORS, MODEL_LABELS, type Prediction } from '@/lib/types';

interface DirectionAccuracyProps {
  predictions: Prediction[];
  metrics: any;
}

export default function DirectionAccuracy({ predictions, metrics }: DirectionAccuracyProps) {
  const { data, actualPosRatio } = useMemo(() => {
    if (!predictions || predictions.length === 0) return { data: [], actualPosRatio: 0 };

    const calcPosRatio = (preds: number[]) =>
      preds.filter((p) => p >= 0).length / preds.length;

    const actuals = predictions.map((p) => p.actual);
    const actualPosRatio = calcPosRatio(actuals);

    const models = ['xgboost', 'lstm', 'arimax'] as const;
    const chartData = models.map((model) => {
      const predKey = `pred${model.charAt(0).toUpperCase() + model.slice(1)}` as keyof Prediction;
      const preds = predictions.map((p) => p[predKey] as number);
      return {
        model: MODEL_LABELS[model],
        da: metrics[model].da,
        posRatio: calcPosRatio(preds),
      };
    });

    return { data: chartData, actualPosRatio };
  }, [predictions, metrics]);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }} layout="vertical">
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
            dataKey="model"
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
            formatter={(value: any, name: any) => [
              `${(Number(value) * 100).toFixed(1)}%`,
              name === 'da' ? 'Direction Accuracy (DA)' : 'Positive Prediction Ratio'
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <ReferenceLine 
            x={actualPosRatio} 
            stroke="oklch(0.60 0.02 100)" 
            strokeDasharray="4 4" 
            label={{ value: `Actual Pos Ratio: ${(actualPosRatio * 100).toFixed(1)}%`, fill: "oklch(0.60 0.02 100)", fontSize: 10, position: 'insideTopLeft' }} 
          />
          <ReferenceLine x={0.5} stroke="oklch(0.40 0.01 250)" strokeDasharray="2 2" />
          <Bar dataKey="da" name="Direction Accuracy" fill="oklch(0.5 0.02 80)" radius={[0, 4, 4, 0]} barSize={20} />
          <Bar dataKey="posRatio" name="Positive Prediction Ratio" fill="oklch(0.7 0.02 200)" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
