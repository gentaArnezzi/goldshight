'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';
import { Prediction, MODEL_COLORS } from '@/lib/types';
import { formatDecimal } from '@/lib/data';

interface TimelineChartProps {
  predictions: Prediction[];
  onDateSelect?: (date: string) => void;
  showArimax?: boolean;
}

export default function TimelineChart({ predictions, onDateSelect, showArimax = true }: TimelineChartProps) {
  const [visible, setVisible] = useState({
    actual: true,
    arimax: showArimax,
    xgboost: true,
    lstm: true,
  });

  const chartData = predictions.map((p) => ({
    date: p.observationDate,
    actual: p.actual,
    arimax: p.predArimax,
    xgboost: p.predXgboost,
    lstm: p.predLstm,
  }));

  const toggleModel = (model: keyof typeof visible) => {
    setVisible((prev) => ({ ...prev, [model]: !prev[model] }));
  };

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['actual', ...(showArimax ? ['arimax'] : []), 'xgboost', 'lstm'] as const).map((key) => (
          <button
            key={key}
            onClick={() => toggleModel(key as keyof typeof visible)}
            className={`
              flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
              border transition-all duration-200
              ${visible[key as keyof typeof visible]
                ? 'border-transparent bg-white/5'
                : 'border-border/30 bg-transparent opacity-40'
              }
            `}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: MODEL_COLORS[key] }}
            />
            {key === 'actual' ? 'Actual' : key.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onClick={(e) => {
              if (e?.activeLabel && onDateSelect) {
                onDateSelect(String(e.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'oklch(0.65 0.02 80)' }}
              tickFormatter={(d: string) => {
                const date = new Date(d + 'T00:00:00');
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
              interval={Math.floor(chartData.length / 12)}
              stroke="oklch(0.25 0.01 250)"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'oklch(0.65 0.02 80)' }}
              tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              stroke="oklch(0.25 0.01 250)"
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.16 0.005 250)',
                border: '1px solid oklch(0.25 0.01 250)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 8px 32px oklch(0 0 0 / 40%)',
              }}
              labelStyle={{ color: 'oklch(0.93 0.01 80)', fontWeight: 600, marginBottom: 8 }}
              formatter={((value: unknown, name: unknown) => [
                `${(Number(value) * 100).toFixed(3)}%`,
                String(name) === 'actual' ? 'Actual' : String(name).toUpperCase(),
              ]) as never}
              labelFormatter={((label: unknown) => {
                const d = new Date(String(label) + 'T00:00:00');
                return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              }) as never}
            />
            <ReferenceLine y={0} stroke="oklch(0.40 0.01 250)" strokeDasharray="4 4" />

            {visible.actual && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke={MODEL_COLORS.actual}
                dot={false}
                strokeWidth={1.5}
                opacity={0.8}
              />
            )}
            {showArimax && visible.arimax && (
              <Line
                type="monotone"
                dataKey="arimax"
                stroke={MODEL_COLORS.arimax}
                dot={false}
                strokeWidth={1.5}
                opacity={0.7}
                strokeDasharray="4 2"
              />
            )}
            {visible.xgboost && (
              <Line
                type="monotone"
                dataKey="xgboost"
                stroke={MODEL_COLORS.xgboost}
                dot={false}
                strokeWidth={1.5}
                opacity={0.8}
              />
            )}
            {visible.lstm && (
              <Line
                type="monotone"
                dataKey="lstm"
                stroke={MODEL_COLORS.lstm}
                dot={false}
                strokeWidth={1.5}
                opacity={0.8}
              />
            )}
            <Brush
              dataKey="date"
              height={30}
              stroke="oklch(0.72 0.14 75)"
              fill="oklch(0.16 0.005 250)"
              tickFormatter={(d: string) => {
                const date = new Date(d + 'T00:00:00');
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
