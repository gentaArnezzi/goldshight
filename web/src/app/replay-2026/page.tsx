'use client';

import { AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { getTestSetData, getOOS2026Data, formatDecimal, formatPercent } from '@/lib/data';
import { MODEL_COLORS } from '@/lib/types';

export default function Replay2026Page() {
  const oos = getOOS2026Data();
  const testSet = getTestSetData();
  const hasPredictions = oos.predictions.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Prominent Disclaimer */}
      <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-amber-200 mb-1">Out-of-Sample Validation</h2>
            <p className="text-sm text-amber-200/70 leading-relaxed">
              Empirical validation beyond the official evaluation period. Limited sample size.{' '}
              <strong className="text-amber-200">Not an investment recommendation.</strong>{' '}
              Statistical conclusions cannot be drawn from this small sample.
            </p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Replay <span className="text-gold-gradient">2026</span>
        </h1>
        <p className="text-muted-foreground">
          Out-of-sample predictions using XGBoost and LSTM (ARIMAX not included)
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last updated: {oos.lastUpdated ? new Date(oos.lastUpdated).toLocaleDateString() : 'Never'}</span>
          <span>·</span>
          <span>Data as of: {oos.dataAsOf || 'N/A'}</span>
        </div>
      </div>

      {hasPredictions ? (
        <div className="space-y-6">
          {/* TODO: Timeline chart with predictions */}
          <div className="glass-card rounded-2xl p-6 text-center py-12">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 text-primary/40" />
            <p className="text-muted-foreground">
              Timeline chart will appear when 2026 data is available via the daily pipeline.
            </p>
          </div>
        </div>
      ) : (
        /* Empty State — Show comparison with test set */
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Awaiting 2026 Data</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              The daily pipeline has not yet been configured. Once GitHub Actions starts running,
              predictions and actual returns for 2026 will appear here.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary">
              Pipeline not yet active
            </div>
          </div>

          {/* Test Set Reference */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Reference: Test Set Performance (2024–2025)</h2>
            <p className="text-xs text-muted-foreground mb-4">
              When 2026 data becomes available, this section will show a side-by-side comparison.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['xgboost', 'lstm'] as const).map((model) => {
                const m = testSet.metrics[model];
                return (
                  <div key={model} className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[model] }} />
                      <h3 className="font-semibold">{model.toUpperCase()}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        Test Set
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold font-mono">{formatDecimal(m.mae)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">MAE</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold font-mono">{formatDecimal(m.rmse)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">RMSE</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold font-mono">{formatPercent(m.da, 1)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">DA</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What to expect */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">What This Page Will Show</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Interactive timeline of XGBoost and LSTM predictions vs actual returns',
                'Date drill-down with "actual not yet available" for recent predictions',
                'Aggregate MAE, RMSE, DA compared side-by-side with test set',
                'Residual and diagnostic plots with sample-size caveats',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
