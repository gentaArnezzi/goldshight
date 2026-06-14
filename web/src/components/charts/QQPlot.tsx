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

// Rational approximation of the inverse of the standard normal CDF
function normSInv(p: number): number {
  const a1 = -3.969683028665376e+01, a2 =  2.209460984245205e+02;
  const a3 = -2.759285104469687e+02, a4 =  1.383577518672690e+02;
  const a5 = -3.066479806614716e+01, a6 =  2.506628277459239e+00;
  const b1 = -5.447609879822406e+01, b2 =  1.615858368580409e+02;
  const b3 = -1.556989798598866e+02, b4 =  6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;
  const c1 = -7.784894002430293e-03, c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00, c4 = -2.549732539343734e+00;
  const c5 =  4.374664141464968e+00, c6 =  2.938163982698783e+00;
  const d1 =  7.784695709041462e-03, d2 =  3.224671290700398e-01;
  const d3 =  2.445134137142996e+00, d4 =  3.754408661907416e+00;
  const p_low = 0.02425, p_high = 1 - p_low;

  let q, r;
  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

interface QQPlotProps {
  residuals: number[];
  modelName: string;
  modelKey: string;
}

export default function QQPlot({ residuals, modelName, modelKey }: QQPlotProps) {
  const color = MODEL_COLORS[modelKey] || '#8884d8';
  const n = residuals.length;
  
  if (n === 0) return null;

  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  
  // Calculate mean and std to draw the reference line
  const mean = sortedResiduals.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(sortedResiduals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);

  const data = sortedResiduals.map((res, i) => {
    const p = (i + 0.5) / n;
    const z = normSInv(p);
    return {
      theoretical: z,
      sample: res,
    };
  });

  // Calculate endpoints for the reference line
  const minZ = Math.min(...data.map(d => d.theoretical));
  const maxZ = Math.max(...data.map(d => d.theoretical));
  
  const refLinePoints = [
    { x: minZ, y: minZ * std + mean },
    { x: maxZ, y: maxZ * std + mean },
  ];

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">{modelName}</h4>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              type="number"
              dataKey="theoretical"
              name="Theoretical Quantiles"
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => val.toFixed(1)}
              stroke="hsl(var(--muted-foreground))"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              label={{ value: 'Theoretical Quantiles', position: 'bottom', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              type="number"
              dataKey="sample"
              name="Sample Quantiles"
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => (val * 100).toFixed(1) + '%'}
              stroke="hsl(var(--muted-foreground))"
              domain={['auto', 'auto']}
              width={40}
              label={{ value: 'Sample Quantiles', angle: -90, position: 'left', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={((value: unknown, name: string) => {
                if (name === 'Sample Quantiles') return [(Number(value) * 100).toFixed(2) + '%', name];
                return [Number(value).toFixed(2), name];
              }) as never}
            />
            <Scatter name={modelName} data={data} fill={color} opacity={0.6} shape="circle" />
            <ReferenceLine
              segment={[refLinePoints[0], refLinePoints[1]]}
              stroke="hsl(var(--foreground))"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
