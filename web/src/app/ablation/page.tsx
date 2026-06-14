'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { FlaskConical, Info } from 'lucide-react';
import { getTestSetData, formatDecimal, formatPercent } from '@/lib/data';
import { MODEL_COLORS, MODEL_LABELS, type AblationResult } from '@/lib/types';

const FEATURE_GROUPS = [
  {
    id: 'G1',
    name: 'Dollar & Rates',
    features: ['DXY_RET', 'US10Y_CHANGE'],
    description: 'US Dollar Index return and 10-year Treasury yield change',
    color: '#3b82f6',
  },
  {
    id: 'G2',
    name: 'Risk Sentiment',
    features: ['SP500_RET', 'VIX_LEVEL'],
    description: 'S&P 500 return and CBOE Volatility Index level',
    color: '#8b5cf6',
  },
  {
    id: 'G3',
    name: 'Commodity Proxy',
    features: ['OIL_RET'],
    description: 'Crude oil futures return',
    color: '#ef4444',
  },
];

const PACKAGES = [
  { id: 'FULL', label: 'FULL', description: 'All feature groups: G1 + G2 + G3' },
  { id: 'NO_G1', label: 'NO_G1', description: 'Without Dollar & Rates (no DXY, US10Y)' },
  { id: 'NO_G2', label: 'NO_G2', description: 'Without Risk Sentiment (no SP500, VIX)' },
  { id: 'NO_G3', label: 'NO_G3', description: 'Without Commodity Proxy (no OIL)' },
  { id: 'GOLD_ONLY', label: 'GOLD_ONLY', description: 'Only gold returns and lags' },
];

export default function AblationPage() {
  const data = getTestSetData();
  const [selectedModel, setSelectedModel] = useState<string>('all');

  const filteredResults = useMemo(() => {
    if (selectedModel === 'all') return data.ablationResults;
    return data.ablationResults.filter((r) => r.model === selectedModel);
  }, [selectedModel, data.ablationResults]);

  // Chart data: MAE by package for each model
  const chartData = useMemo(() => {
    const packages = ['FULL', 'NO_G1', 'NO_G2', 'NO_G3', 'GOLD_ONLY'];
    return packages.map((pkg) => {
      const row: Record<string, string | number> = { package: pkg };
      for (const model of ['ARIMAX', 'XGBoost', 'LSTM']) {
        const result = data.ablationResults.find(
          (r) => r.model === model && r.package === pkg
        );
        if (result) {
          row[model] = result.mae;
        }
      }
      return row;
    });
  }, [data.ablationResults]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-gold-gradient">Ablation Study</span>
        </h1>
        <p className="text-muted-foreground">
          Feature group contribution analysis — validation set performance
        </p>
      </div>

      {/* Key Insight */}
      <div className="glass-card-gold rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <FlaskConical className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold mb-1">Key Finding</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">NO_G3</strong> (excluding oil/commodity proxy) achieves the
              best validation MAE for both XGBoost and LSTM, although the performance difference is marginal (in the 4th/5th decimal). Meanwhile, ARIMAX performs best with the{' '}
              <strong className="text-foreground">FULL</strong> feature set. This suggests that while oil futures
              returns provide a useful signal for the linear ARIMAX model, they do not offer a substantial predictive advantage for the ML models in this specific non-causal forecasting setup.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Groups Legend */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Feature Groups</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.id} className="flex items-start gap-3">
              <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: group.color }} />
              <div>
                <div className="text-sm font-medium">
                  {group.id}: {group.name}
                </div>
                <div className="text-xs text-muted-foreground">{group.description}</div>
                <div className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                  {group.features.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">MAE by Feature Package</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Validation set MAE for each feature package. Lower is better.
        </p>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.01 250)" />
              <XAxis
                dataKey="package"
                tick={{ fontSize: 11, fill: 'oklch(0.85 0.02 80)' }}
                stroke="oklch(0.25 0.01 250)"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(0.65 0.02 80)' }}
                stroke="oklch(0.25 0.01 250)"
                tickFormatter={(v: number) => v.toFixed(4)}
                domain={['dataMin - 0.0002', 'dataMax + 0.0002']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.16 0.005 250)',
                  border: '1px solid oklch(0.25 0.01 250)',
                  borderRadius: '12px',
                  padding: '12px',
                }}
                formatter={((value: unknown) => [Number(value).toFixed(6), '']) as never}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              <Bar dataKey="ARIMAX" fill={MODEL_COLORS.arimax} opacity={0.8} radius={[4, 4, 0, 0]} />
              <Bar dataKey="XGBoost" fill={MODEL_COLORS.xgboost} opacity={0.8} radius={[4, 4, 0, 0]} />
              <Bar dataKey="LSTM" fill={MODEL_COLORS.lstm} opacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Detailed Results</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Filter model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg bg-input border border-border px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            >
              <option value="all">All Models</option>
              <option value="ARIMAX">ARIMAX</option>
              <option value="XGBoost">XGBoost</option>
              <option value="LSTM">LSTM</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Model</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Package</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">MAE</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">RMSE</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">DA</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">MAE Rank</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r, i) => {
                const isBest = r.maeRank === 1;
                return (
                  <tr
                    key={i}
                    className={`border-b border-border/20 hover:bg-muted/20 transition-colors ${
                      isBest ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: MODEL_COLORS[r.model.toLowerCase()] }}
                        />
                        <span className="font-medium">{r.model}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isBest ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground'
                      }`}>
                        {r.package}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 font-mono">{formatDecimal(r.mae, 6)}</td>
                    <td className="text-right py-3 px-4 font-mono">{formatDecimal(r.rmse, 6)}</td>
                    <td className="text-right py-3 px-4 font-mono">{formatPercent(r.da, 1)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs font-bold ${isBest ? 'text-primary' : 'text-muted-foreground/50'}`}>
                        #{r.maeRank}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Package descriptions */}
        <div className="mt-6 pt-4 border-t border-border/20">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Package Descriptions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PACKAGES.map((pkg) => (
              <div key={pkg.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="font-mono font-medium text-foreground/80">{pkg.label}:</span>
                <span>{pkg.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
