'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  Brush, ReferenceLine, BarChart, Bar, Cell, ScatterChart, Scatter,
} from 'recharts';
import { AlertTriangle, CalendarDays, TrendingUp, Activity } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QQPlot from '@/components/charts/QQPlot';
import {
  getOOS2026Data, getTestSetData,
  formatDecimal, formatPercent, formatDate, getDataFreshnessStatus,
} from '@/lib/data';
import { MODEL_COLORS, MODEL_LABELS, type OOSPrediction } from '@/lib/types';

export default function Replay2026Page() {
  const oos = getOOS2026Data();
  const testSet = getTestSetData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'analysis'>('timeline');

  const hasPredictions = oos.predictions.length > 0;
  const hasActuals = oos.aggregateMetrics.nObservations > 0;
  const freshness = oos.lastUpdated ? getDataFreshnessStatus(oos.lastUpdated) : 'red';

  // Predictions with actuals only (for analysis)
  const evaluatedPredictions = useMemo(
    () => oos.predictions.filter((p) => p.actual !== null),
    [oos.predictions]
  );

  const selectedPrediction = useMemo(() => {
    if (!selectedDate) return null;
    return oos.predictions.find((p) => p.observationDate === selectedDate) || null;
  }, [selectedDate, oos.predictions]);

  // Context window
  const contextWindow = useMemo(() => {
    if (!selectedDate) return [];
    const idx = oos.predictions.findIndex((p) => p.observationDate === selectedDate);
    if (idx === -1) return [];
    const start = Math.max(0, idx - 5);
    const end = Math.min(oos.predictions.length, idx + 6);
    return oos.predictions.slice(start, end);
  }, [selectedDate, oos.predictions]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Disclaimer Banner */}
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">Out-of-Sample Validation</p>
          <p className="text-xs text-amber-300/70 mt-1">
            Validasi empiris di luar evaluasi resmi. Sampel terbatas. <strong>Bukan rekomendasi investasi.</strong>{' '}
            ARIMAX tidak ditampilkan di halaman ini. Paket fitur tetap NO_G3.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Replay <span className="text-gold-gradient">2026</span>
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {oos.dataAsOf && (
            <>
              <span>Data as of: {formatDate(oos.dataAsOf)}</span>
              <span className={`inline-block h-2 w-2 rounded-full ${
                freshness === 'green' ? 'bg-green-400' :
                freshness === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
            </>
          )}
          {hasActuals && (
            <span>{oos.aggregateMetrics.nObservations} evaluated predictions</span>
          )}
        </div>
      </div>

      {!hasPredictions ? (
        /* Empty state */
        <div className="glass-card rounded-2xl p-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold mb-2">Awaiting 2026 Data</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            The daily pipeline has not yet produced predictions. Run the pipeline manually
            or wait for the next scheduled execution.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            Pipeline not yet active
          </div>

          {/* Test set reference */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {(['xgboost', 'lstm'] as const).map((model) => (
              <div key={model} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[model] }} />
                  <span className="text-sm font-medium">{MODEL_LABELS[model]}</span>
                </div>
                <div className="text-xs text-muted-foreground">Test Set 2024–2025</div>
                <div className="text-lg font-bold font-mono mt-1">
                  {formatDecimal(testSet.metrics[model].mae)}
                </div>
                <div className="text-xs text-muted-foreground">MAE</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Active state with predictions */
        <>
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-muted/30 w-fit">
            {[
              { key: 'timeline', label: 'Timeline & Drill-Down', icon: CalendarDays },
              { key: 'analysis', label: 'Analysis', icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`
                  flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200
                  ${activeTab === key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Aggregate Metrics — Side by side with test set */}
              {hasActuals && oos.aggregateMetrics.xgboost && oos.aggregateMetrics.lstm && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(['xgboost', 'lstm'] as const).map((model) => {
                    const oos2026 = oos.aggregateMetrics[model] as { mae: number; rmse: number; da: number };
                    const test = testSet.metrics[model];
                    const maeDiff = ((oos2026.mae - test.mae) / test.mae) * 100;
                    return (
                      <div key={model} className="glass-card rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: MODEL_COLORS[model] }} />
                          <span className="font-semibold">{MODEL_LABELS[model]}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">MAE</div>
                            <div className="text-sm font-mono">{formatDecimal(oos2026.mae)}</div>
                            <div className={`text-[10px] mt-0.5 ${maeDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {maeDiff > 0 ? '↑' : '↓'} {Math.abs(maeDiff).toFixed(1)}% vs test
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">RMSE</div>
                            <div className="text-sm font-mono">{formatDecimal(oos2026.rmse)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">DA</div>
                            <div className="text-sm font-mono">{formatPercent(oos2026.da, 1)}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-3">
                          Based on {oos.aggregateMetrics.nObservations} observations · Not statistically significant
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Timeline Chart */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Actual vs Predicted — 2026</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  XGBoost and LSTM predictions for 5-day gold return. Click any point to drill down.
                </p>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={oos.predictions}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      onClick={(e) => {
                        if (e?.activeLabel) setSelectedDate(String(e.activeLabel));
                      }}
                    >
                      <XAxis
                        dataKey="observationDate"
                        tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 250)' }}
                        tickFormatter={(d: string) => {
                          const dt = new Date(d + 'T00:00:00');
                          return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 250)' }}
                        tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'oklch(0.18 0.01 250)',
                          border: '1px solid oklch(0.30 0.02 250)',
                          borderRadius: '12px',
                          padding: '12px',
                        }}
                        labelStyle={{ color: 'oklch(0.93 0.01 80)', fontWeight: 600, marginBottom: 8 }}
                        formatter={((value: unknown) => [
                          value != null ? `${(Number(value) * 100).toFixed(3)}%` : 'N/A',
                          '',
                        ]) as never}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                      <ReferenceLine y={0} stroke="oklch(0.40 0.01 250)" strokeDasharray="4 4" />
                      <Line
                        type="monotone" dataKey="actual" name="Actual"
                        stroke={MODEL_COLORS.actual} strokeWidth={2} dot={false}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone" dataKey="predXgboost" name="XGBoost"
                        stroke={MODEL_COLORS.xgboost} strokeWidth={1.5} dot={false}
                        strokeDasharray="4 2"
                      />
                      <Line
                        type="monotone" dataKey="predLstm" name="LSTM"
                        stroke={MODEL_COLORS.lstm} strokeWidth={1.5} dot={false}
                        strokeDasharray="4 2"
                      />
                      <Brush
                        dataKey="observationDate" height={25} stroke="oklch(0.40 0.02 80)"
                        fill="oklch(0.14 0.005 250)" travellerWidth={8}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Date Drill-Down */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Date Drill-Down</h2>
                <DatePicker2026
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  availableDates={oos.predictions.map((p) => p.observationDate)}
                />

                {selectedPrediction ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS.actual }} />
                          <span className="text-sm font-medium">Actual</span>
                        </div>
                        {selectedPrediction.actual !== null ? (
                          <div className="text-xl font-bold font-mono">
                            {formatPercent(selectedPrediction.actual)}
                          </div>
                        ) : (
                          <div className="text-sm text-amber-400/80 italic">
                            Horizon belum lewat
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Target: {selectedPrediction.targetDate}
                        </div>
                      </div>
                      <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS.xgboost }} />
                          <span className="text-sm font-medium">XGBoost</span>
                        </div>
                        <div className="text-xl font-bold font-mono">
                          {formatPercent(selectedPrediction.predXgboost)}
                        </div>
                        {selectedPrediction.errXgboost !== null && (
                          <div className="text-xs text-muted-foreground mt-1">
                            |Error|: {formatPercent(Math.abs(selectedPrediction.errXgboost))}
                          </div>
                        )}
                      </div>
                      <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS.lstm }} />
                          <span className="text-sm font-medium">LSTM</span>
                        </div>
                        <div className="text-xl font-bold font-mono">
                          {selectedPrediction.predLstm != null
                            ? formatPercent(selectedPrediction.predLstm)
                            : 'N/A'}
                        </div>
                        {selectedPrediction.errLstm !== null && (
                          <div className="text-xs text-muted-foreground mt-1">
                            |Error|: {formatPercent(Math.abs(selectedPrediction.errLstm))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context table */}
                    {contextWindow.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/40">
                              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actual</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">XGBoost</th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">LSTM</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contextWindow.map((p) => (
                              <tr
                                key={p.observationDate}
                                className={`border-b border-border/20 ${
                                  p.observationDate === selectedDate ? 'bg-primary/5' : ''
                                }`}
                              >
                                <td className="py-2 px-3 font-mono">{p.observationDate}</td>
                                <td className="text-right py-2 px-3 font-mono">
                                  {p.actual != null ? formatPercent(p.actual) : '—'}
                                </td>
                                <td className="text-right py-2 px-3 font-mono" style={{ color: MODEL_COLORS.xgboost }}>
                                  {formatPercent(p.predXgboost)}
                                </td>
                                <td className="text-right py-2 px-3 font-mono" style={{ color: MODEL_COLORS.lstm }}>
                                  {p.predLstm != null ? formatPercent(p.predLstm) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Click a point on the timeline or pick a date above.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {!hasActuals ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-amber-400/40" />
                  <p className="text-sm text-muted-foreground">
                    No evaluated predictions yet. Analysis charts will appear once target dates have passed.
                  </p>
                </div>
              ) : (
                <>
                  {/* Error Distribution */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Error Distribution — 2026</h2>
                    <OOSErrorDistribution predictions={evaluatedPredictions} />
                    <p className="text-[10px] text-muted-foreground mt-3">
                      Based on {evaluatedPredictions.length} observations. Interpretasi terbatas akibat ukuran sampel.
                    </p>
                  </div>

                  {/* Direction Accuracy */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Direction Accuracy — 2026</h2>
                    <OOSDirectionAccuracy
                      predictions={evaluatedPredictions}
                      testMetrics={testSet.metrics}
                    />
                  </div>

                  {/* Residual Plots */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Residual vs Predicted — 2026</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {(['xgboost', 'lstm'] as const).map((model) => {
                        const predKey = model === 'xgboost' ? 'predXgboost' : 'predLstm';
                        const errKey = model === 'xgboost' ? 'errXgboost' : 'errLstm';
                        const data = evaluatedPredictions
                          .filter((p) => p[predKey] != null && p[errKey] != null)
                          .map((p) => ({
                            predicted: p[predKey] as number,
                            residual: p[errKey] as number,
                          }));
                        return (
                          <div key={model}>
                            <h3 className="text-sm font-medium mb-2" style={{ color: MODEL_COLORS[model] }}>
                              {MODEL_LABELS[model]}
                            </h3>
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                                  <XAxis
                                    type="number" dataKey="predicted" name="Predicted"
                                    tick={{ fontSize: 9, fill: 'oklch(0.55 0.02 250)' }}
                                    tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                                  />
                                  <YAxis
                                    type="number" dataKey="residual" name="Residual"
                                    tick={{ fontSize: 9, fill: 'oklch(0.55 0.02 250)' }}
                                    tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'oklch(0.18 0.01 250)',
                                      border: '1px solid oklch(0.30 0.02 250)',
                                      borderRadius: '12px',
                                      padding: '12px',
                                    }}
                                    formatter={((value: unknown) => `${(Number(value) * 100).toFixed(3)}%`) as never}
                                  />
                                  <ReferenceLine y={0} stroke="oklch(0.40 0.01 250)" strokeDasharray="4 4" />
                                  <Scatter data={data} fill={MODEL_COLORS[model]} opacity={0.5} r={3} />
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">
                      Visualisasi diagnostik berdasarkan {evaluatedPredictions.length} observasi; interpretasi terbatas.
                    </p>
                  </div>

                  {/* Q-Q Plots */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Q-Q Plots (Normality of Residuals) — 2026</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {(['xgboost', 'lstm'] as const).map((model) => {
                        const errKey = model === 'xgboost' ? 'errXgboost' : 'errLstm';
                        const residuals = evaluatedPredictions
                          .filter((p) => p[errKey] != null)
                          .map((p) => p[errKey] as number);
                        return (
                          <QQPlot
                            key={model}
                            residuals={residuals}
                            modelName={MODEL_LABELS[model]}
                            modelKey={model}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Date Picker ────────────────────────────────────────────────────────────

function DatePicker2026({
  selectedDate,
  onSelect,
  availableDates,
}: {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  availableDates: string[];
}) {
  const [open, setOpen] = useState(false);
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined;
  const minDate = availableDates.length > 0 ? new Date(availableDates[0] + 'T00:00:00') : new Date();
  const maxDate = availableDates.length > 0 ? new Date(availableDates[availableDates.length - 1] + 'T00:00:00') : new Date();

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      if (availableSet.has(dateStr)) {
        onSelect(dateStr);
        setOpen(false);
      }
    } else {
      onSelect(null);
    }
  };

  const isDateDisabled = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return !availableSet.has(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      <label className="text-sm text-muted-foreground">Select date:</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={`
            flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-mono
            transition-all duration-200 min-w-[220px] text-left cursor-pointer
            ${selectedDate
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'border-border bg-input text-muted-foreground'
            }
            hover:border-primary/40 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30
          `}
        >
          <CalendarDays className="h-4 w-4 text-primary/60" />
          {selectedDate ? formatDate(selectedDate) : 'Pick a date...'}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDateObj}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            defaultMonth={selectedDateObj || maxDate}
            startMonth={minDate}
            endMonth={maxDate}
            className="rounded-xl"
          />
        </PopoverContent>
      </Popover>
      {selectedDate && (
        <button
          onClick={() => onSelect(null)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── OOS Error Distribution ─────────────────────────────────────────────────

function OOSErrorDistribution({ predictions }: { predictions: OOSPrediction[] }) {
  const buckets = useMemo(() => {
    const bins = 20;
    const allErrors: { model: string; error: number }[] = [];
    for (const p of predictions) {
      if (p.errXgboost != null) allErrors.push({ model: 'XGBoost', error: p.errXgboost });
      if (p.errLstm != null) allErrors.push({ model: 'LSTM', error: p.errLstm });
    }
    if (allErrors.length === 0) return [];

    const min = Math.min(...allErrors.map((e) => e.error));
    const max = Math.max(...allErrors.map((e) => e.error));
    const step = (max - min) / bins;

    const result: { bin: string; xgboost: number; lstm: number }[] = [];
    for (let i = 0; i < bins; i++) {
      const lo = min + i * step;
      const hi = lo + step;
      const label = `${(lo * 100).toFixed(1)}%`;
      const xgb = allErrors.filter(
        (e) => e.model === 'XGBoost' && e.error >= lo && (i < bins - 1 ? e.error < hi : e.error <= hi)
      ).length;
      const lstm = allErrors.filter(
        (e) => e.model === 'LSTM' && e.error >= lo && (i < bins - 1 ? e.error < hi : e.error <= hi)
      ).length;
      result.push({ bin: label, xgboost: xgb, lstm });
    }
    return result;
  }, [predictions]);

  if (buckets.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <XAxis dataKey="bin" tick={{ fontSize: 8, fill: 'oklch(0.55 0.02 250)' }} interval={2} />
          <YAxis tick={{ fontSize: 9, fill: 'oklch(0.55 0.02 250)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.18 0.01 250)',
              border: '1px solid oklch(0.30 0.02 250)',
              borderRadius: '12px',
            }}
          />
          <Bar dataKey="xgboost" fill={MODEL_COLORS.xgboost} opacity={0.7} name="XGBoost" />
          <Bar dataKey="lstm" fill={MODEL_COLORS.lstm} opacity={0.7} name="LSTM" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── OOS Direction Accuracy ─────────────────────────────────────────────────

function OOSDirectionAccuracy({
  predictions,
  testMetrics,
}: {
  predictions: OOSPrediction[];
  testMetrics: { xgboost: { da: number }; lstm: { da: number } };
}) {
  const data = useMemo(() => {
    const calcDA = (preds: number[], actuals: number[]) =>
      preds.filter((p, i) => (p >= 0) === (actuals[i] >= 0)).length / preds.length;

    const actuals = predictions.filter((p) => p.actual != null).map((p) => p.actual as number);
    const xgbPreds = predictions.filter((p) => p.actual != null).map((p) => p.predXgboost);
    const lstmPreds = predictions.filter((p) => p.actual != null && p.predLstm != null).map((p) => p.predLstm as number);

    return [
      { label: 'XGBoost 2026', da: actuals.length > 0 ? calcDA(xgbPreds, actuals) : 0, color: MODEL_COLORS.xgboost },
      { label: 'LSTM 2026', da: actuals.length > 0 ? calcDA(lstmPreds, actuals) : 0, color: MODEL_COLORS.lstm },
      { label: 'XGBoost Test', da: testMetrics.xgboost.da, color: MODEL_COLORS.xgboost + '60' },
      { label: 'LSTM Test', da: testMetrics.lstm.da, color: MODEL_COLORS.lstm + '60' },
    ];
  }, [predictions, testMetrics]);

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 100 }}>
          <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 250)' }}
          />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'oklch(0.65 0.02 250)' }} width={100} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(0.18 0.01 250)',
              border: '1px solid oklch(0.30 0.02 250)',
              borderRadius: '12px',
            }}
            formatter={((value: unknown) => [`${(Number(value) * 100).toFixed(1)}%`, 'DA']) as never}
          />
          <ReferenceLine x={0.5} stroke="oklch(0.40 0.01 250)" strokeDasharray="4 4" />
          <Bar dataKey="da" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
