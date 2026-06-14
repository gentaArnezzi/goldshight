'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Prediction } from '@/lib/types';

interface ErrorMagnitudeChartProps {
  predictions: Prediction[];
  models: { key: keyof Prediction; label: string; color: string }[];
}

export default function ErrorMagnitudeChart({ predictions, models }: ErrorMagnitudeChartProps) {
  // Define buckets for ACTUAL returns
  const buckets = [
    { label: '<= -2%', min: -Infinity, max: -0.02 },
    { label: '-2% to -1%', min: -0.02, max: -0.01 },
    { label: '-1% to 0%', min: -0.01, max: 0 },
    { label: '0% to +1%', min: 0, max: 0.01 },
    { label: '+1% to +2%', min: 0.01, max: 0.02 },
    { label: '>= +2%', min: 0.02, max: Infinity },
  ];

  // Group predictions into buckets
  const bucketedData = buckets.map(bucket => {
    const bucketPreds = predictions.filter(p => {
      const actual = p.actual as number;
      // Handle bounds precisely
      if (bucket.min === -Infinity) return actual <= bucket.max;
      if (bucket.max === Infinity) return actual > bucket.min;
      return actual > bucket.min && actual <= bucket.max;
    });

    const result: any = {
      name: `${bucket.label} (n=${bucketPreds.length})`,
      count: bucketPreds.length,
    };

    // Calculate MAE for each model in this bucket
    models.forEach(model => {
      if (bucketPreds.length === 0) {
        result[model.label] = 0;
        return;
      }
      
      const sumAbsError = bucketPreds.reduce((sum, p) => {
        const err = p[model.key] as number;
        return sum + Math.abs(err);
      }, 0);
      
      result[model.label] = sumAbsError / bucketPreds.length;
    });

    return result;
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bucketedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            tick={{ fontSize: 11 }}
            tickFormatter={(val) => (val * 100).toFixed(1) + '%'}
            axisLine={false}
            tickLine={false}
            dx={-10}
            label={{ value: 'Mean Absolute Error', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }, dx: -10 }}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={((value: unknown, name: string) => {
              if (name === 'count') return [Number(value), 'Number of Samples'];
              return [(Number(value) * 100).toFixed(3) + '%', name];
            }) as never}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          {models.map(model => (
            <Bar 
              key={model.label} 
              dataKey={model.label} 
              fill={model.color} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
