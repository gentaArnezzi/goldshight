'use client';

import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Table2, BarChart3, TrendingUp, CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import TimelineChart from '@/components/charts/TimelineChart';
import ErrorDistribution from '@/components/charts/ErrorDistribution';
import DirectionAccuracy from '@/components/charts/DirectionAccuracy';
import ResidualPlot from '@/components/charts/ResidualPlot';
import QQPlot from '@/components/charts/QQPlot';
import ErrorMagnitudeChart from '@/components/charts/ErrorMagnitudeChart';
import { getTestSetData, formatDecimal, formatPercent, formatDate, getQuarter } from '@/lib/data';
import { MODEL_COLORS, MODEL_LABELS, type Prediction, type SignificanceTest } from '@/lib/types';

export default function TestResultsPage() {
  const data = getTestSetData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'analysis' | 'breakdown'>('timeline');

  const selectedPrediction = useMemo(() => {
    if (!selectedDate) return null;
    return data.predictions.find((p) => p.observationDate === selectedDate) || null;
  }, [selectedDate, data.predictions]);

  // Context window around selected date
  const contextWindow = useMemo(() => {
    if (!selectedDate) return [];
    const idx = data.predictions.findIndex((p) => p.observationDate === selectedDate);
    if (idx === -1) return [];
    const start = Math.max(0, idx - 5);
    const end = Math.min(data.predictions.length, idx + 6);
    return data.predictions.slice(start, end);
  }, [selectedDate, data.predictions]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Test Set Results <span className="text-gold-gradient">2024–2025</span>
        </h1>
        <p className="text-muted-foreground">
          {data.meta.totalObservations} observations · {data.meta.testPeriod.start} to {data.meta.testPeriod.end}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-muted/30 w-fit">
        {[
          { key: 'timeline', label: 'Timeline & Drill-Down', icon: CalendarIcon },
          { key: 'analysis', label: 'Analysis', icon: BarChart3 },
          { key: 'breakdown', label: 'Breakdown', icon: Table2 },
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

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Timeline Chart */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Actual vs Predicted Returns</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Click on any point to drill down. Use the brush control below to zoom into a date range.
            </p>
            <TimelineChart predictions={data.predictions} onDateSelect={setSelectedDate} />
          </div>

          {/* Date Drill-Down */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Date Drill-Down</h2>

            {/* Date picker */}
            <DatePicker
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              availableDates={data.predictions.map((p) => p.observationDate)}
            />

            {selectedPrediction ? (
              <div className="space-y-4">
                {/* Selected date cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <DrillDownCard
                    label="Actual"
                    value={formatPercent(selectedPrediction.actual)}
                    color={MODEL_COLORS.actual}
                    subtitle={`Target: ${selectedPrediction.targetDate}`}
                  />
                  <DrillDownCard
                    label="ARIMAX"
                    value={formatPercent(selectedPrediction.predArimax)}
                    error={Math.abs(selectedPrediction.errArimax)}
                    color={MODEL_COLORS.arimax}
                  />
                  <DrillDownCard
                    label="XGBoost"
                    value={formatPercent(selectedPrediction.predXgboost)}
                    error={Math.abs(selectedPrediction.errXgboost)}
                    color={MODEL_COLORS.xgboost}
                  />
                  <DrillDownCard
                    label="LSTM"
                    value={formatPercent(selectedPrediction.predLstm)}
                    error={Math.abs(selectedPrediction.errLstm)}
                    color={MODEL_COLORS.lstm}
                  />
                </div>

                {/* Context table */}
                {contextWindow.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/40">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Actual</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">ARIMAX</th>
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
                            <td className="text-right py-2 px-3 font-mono">{formatPercent(p.actual)}</td>
                            <td className="text-right py-2 px-3 font-mono" style={{ color: MODEL_COLORS.arimax }}>
                              {formatPercent(p.predArimax)}
                            </td>
                            <td className="text-right py-2 px-3 font-mono" style={{ color: MODEL_COLORS.xgboost }}>
                              {formatPercent(p.predXgboost)}
                            </td>
                            <td className="text-right py-2 px-3 font-mono" style={{ color: MODEL_COLORS.lstm }}>
                              {formatPercent(p.predLstm)}
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
                <p className="text-sm">Click a point on the timeline or pick a date above to drill down.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Metrics Table */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Final Test Metrics</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Model</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">MAE</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">RMSE</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">DA</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'lstm', label: 'LSTM', type: 'Model' },
                    { key: 'xgboost', label: 'XGBoost', type: 'Model' },
                    { key: 'arimax', label: 'ARIMAX', type: 'Model' },
                    { key: 'zeroBenchmark', label: 'Zero Benchmark', type: 'Benchmark' },
                    { key: 'persistenceBenchmark', label: 'Persistence', type: 'Benchmark' },
                  ].map(({ key, label, type }) => {
                    const m = data.metrics[key as keyof typeof data.metrics];
                    return (
                      <tr key={key} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: MODEL_COLORS[key] || '#6b7280' }}
                            />
                            <span className="font-medium">{label}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-mono">{formatDecimal(m.mae)}</td>
                        <td className="text-right py-3 px-4 font-mono">{formatDecimal(m.rmse)}</td>
                        <td className="text-right py-3 px-4 font-mono">{formatPercent(m.da, 1)}</td>
                        <td className="text-right py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            type === 'Model'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}>
                            {type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Significance Tests */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Statistical Significance Tests</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Diebold-Mariano (DM) test and Wilcoxon signed-rank test at 5% significance level.
              Newey-West correction with 4 lags applied.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Comparison</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Loss</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">DM Stat</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">DM p-value</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Wilcoxon p</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Significant</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Conclusion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.significanceTests.map((test, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-3 font-medium">{test.comparison}</td>
                      <td className="py-2 px-3 text-muted-foreground">{test.lossType}</td>
                      <td className="text-right py-2 px-3 font-mono">{test.dmStat.toFixed(3)}</td>
                      <td className="text-right py-2 px-3 font-mono">{test.dmPvalue < 0.001 ? '<0.001' : test.dmPvalue.toFixed(3)}</td>
                      <td className="text-right py-2 px-3 font-mono">{test.wilcoxonPvalue < 0.001 ? '<0.001' : test.wilcoxonPvalue.toFixed(3)}</td>
                      <td className="text-center py-2 px-3">
                        <span className={`inline-block h-2 w-2 rounded-full ${test.significant ? 'bg-green-400' : 'bg-muted-foreground/30'}`} />
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{test.conclusion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Distribution */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Error Distribution</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">💡 Insight Analitis:</span> Distribusi eror XGBoost dan LSTM lebih mengerucut di sekitar angka nol dibandingkan ARIMAX. Ini membuktikan bahwa model ML jauh lebih konsisten menghasilkan eror kecil secara rata-rata. Namun, ketiga model memiliki ekor yang panjang (heavy tails), menegaskan bahwa semua model kesulitan memprediksi secara akurat anomali pergerakan ekstrem.
              </p>
            </div>
            <ErrorDistribution predictions={data.predictions} />
          </div>

          {/* Direction Accuracy */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Direction Accuracy</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">💡 Insight Analitis:</span> Meskipun model ML menang telak dalam meminimalkan magnitudo eror (MAE), Akurasi Arah (DA) XGBoost sebesar 65% sesungguhnya disebabkan oleh rasio prediksi positifnya yang mencapai 98.4%. Ini berarti XGBoost hampir selalu memprediksi harga akan naik karena target didominasi nilai positif. Fakta ini membuktikan bahwa memprediksi arah pergerakan harian yang pasti tetap sangat sulit dilakukan.
              </p>
            </div>
            <DirectionAccuracy
              data={[
                { model: 'XGBoost', da: data.metrics.xgboost.da, label: 'XGBoost' },
                { model: 'LSTM', da: data.metrics.lstm.da, label: 'LSTM' },
                { model: 'ARIMAX', da: data.metrics.arimax.da, label: 'ARIMAX' },
                { model: 'persistence', da: data.metrics.persistenceBenchmark.da, label: 'Persistence' },
                { model: 'zero', da: data.metrics.zeroBenchmark.da, label: 'Zero' },
              ]}
            />
          </div>

          {/* Residual Plots */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Residual vs Predicted</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">💡 Insight Analitis:</span> Sebaran titik menunjukkan pola korelasi negatif yang tipis. Artinya, model cenderung meremehkan (underestimate) saat return aktual melonjak tajam positif, dan melebih-lebihkan (overestimate) saat return aktual anjlok tajam. Ini adalah bias struktural di mana model bermain aman dengan memprediksi nilai yang konservatif guna meminimalkan penalti fungsi loss (RMSE/MAE).
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(['arimax', 'xgboost', 'lstm'] as const).map((model) => {
                const predKey = `pred${model.charAt(0).toUpperCase() + model.slice(1)}` as keyof Prediction;
                const errKey = `err${model.charAt(0).toUpperCase() + model.slice(1)}` as keyof Prediction;
                const residualData = data.predictions.map((p) => ({
                  predicted: p[predKey] as number,
                  residual: p[errKey] as number,
                }));
                return (
                  <ResidualPlot
                    key={model}
                    data={residualData}
                    modelName={MODEL_LABELS[model]}
                    modelKey={model}
                  />
                );
              })}
            </div>
          </div>

          {/* Q-Q Plots */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Q-Q Plots (Normality of Residuals)</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">💡 Insight Analitis:</span> Penyimpangan titik-titik pada ujung ekor dari garis diagonal merah membuktikan bahwa eror model tidak berdistribusi normal murni (terdapat kurtosis berlebih/anomali ekstrem). Fenomena ini melanggar asumsi dasar dari pemodelan regresi linear klasik, yang sekaligus menjelaskan mengapa algoritma ML non-linear (XGBoost/LSTM) mampu mencetak performa MAE yang jauh lebih baik daripada model linear ARIMAX.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(['arimax', 'xgboost', 'lstm'] as const).map((model) => {
                const errKey = `err${model.charAt(0).toUpperCase() + model.slice(1)}` as keyof Prediction;
                const residuals = data.predictions.map((p) => p[errKey] as number);
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
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          {/* Error by Magnitude Bucket */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Error by Actual Return Magnitude</h2>
            <p className="text-xs text-muted-foreground mb-6 max-w-3xl">
              Visualisasi ini memecah Mean Absolute Error (MAE) berdasarkan rentang nilai actual return. 
              Hal ini menunjukkan di kondisi pergerakan pasar apa model memiliki tingkat kesalahan terbesar (misalnya pada pergerakan ekstrem &gt; 2%).<br/>
              <span className="text-[10px] text-muted-foreground/80 mt-2 block">
                * (n=...) pada sumbu-X menunjukkan jumlah observasi/sampel uji untuk masing-masing rentang pergerakan.
              </span>
            </p>
            <ErrorMagnitudeChart 
              predictions={data.predictions} 
              models={[
                { key: 'errXgboost', label: 'XGBoost', color: MODEL_COLORS.xgboost },
                { key: 'errLstm', label: 'LSTM', color: MODEL_COLORS.lstm },
                { key: 'errArimax', label: 'ARIMAX', color: MODEL_COLORS.arimax },
              ]}
            />
          </div>

          {/* Quarterly Breakdown */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Quarterly Performance</h2>
            <QuarterlyBreakdown predictions={data.predictions} />
          </div>

          {/* Monthly Error Heatmap */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly MAE Heatmap</h2>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-primary">💡 Insight Analitis:</span> Kinerja model tidak merata sepanjang waktu. Blok warna yang lebih gelap (MAE tinggi) bergerombol pada bulan-bulan tertentu dengan volatilitas tinggi. Ini memperkuat kesimpulan bahwa model prediksi return sangat rentan terhadap perubahan rezim pasar dan guncangan makroekonomi tak terduga.
              </p>
            </div>
            <MonthlyHeatmap predictions={data.predictions} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Date Picker with Calendar ---
function DatePicker({
  selectedDate,
  onSelect,
  availableDates,
}: {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  availableDates: string[];
}) {
  const [open, setOpen] = useState(false);

  // Set of available dates for quick lookup
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  // Parse selected date for the Calendar component
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined;

  // Date range for the calendar
  const minDate = new Date(availableDates[0] + 'T00:00:00');
  const maxDate = new Date(availableDates[availableDates.length - 1] + 'T00:00:00');

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

  // Disable dates that don't have predictions
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
          {selectedDate
            ? formatDate(selectedDate)
            : 'Pick a date...'}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDateObj}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            defaultMonth={selectedDateObj || minDate}
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

// --- Drill-Down Card ---
function DrillDownCard({
  label,
  value,
  error,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  error?: number;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono">{value}</div>
      {error !== undefined && (
        <div className="text-xs text-muted-foreground mt-1">
          |Error|: {formatPercent(error)}
        </div>
      )}
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

// --- Quarterly Breakdown ---
function QuarterlyBreakdown({ predictions }: { predictions: Prediction[] }) {
  const quarters = useMemo(() => {
    const map: Record<string, Prediction[]> = {};
    for (const p of predictions) {
      const q = getQuarter(p.targetDate);
      if (!map[q]) map[q] = [];
      map[q].push(p);
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, preds]) => {
        const calcMAE = (errFn: (p: Prediction) => number) =>
          preds.reduce((sum, p) => sum + Math.abs(errFn(p)), 0) / preds.length;
        const calcDA = (predFn: (p: Prediction) => number) =>
          preds.filter((p) => (p.actual >= 0) === (predFn(p) >= 0)).length / preds.length;

        return {
          quarter,
          n: preds.length,
          arimax: { mae: calcMAE((p) => p.errArimax), da: calcDA((p) => p.predArimax) },
          xgboost: { mae: calcMAE((p) => p.errXgboost), da: calcDA((p) => p.predXgboost) },
          lstm: { mae: calcMAE((p) => p.errLstm), da: calcDA((p) => p.predLstm) },
        };
      });
  }, [predictions]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40">
            <th className="text-left py-2 px-3 text-muted-foreground font-medium">Quarter</th>
            <th className="text-right py-2 px-3 text-muted-foreground font-medium">N</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: MODEL_COLORS.arimax }}>ARIMAX MAE</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: MODEL_COLORS.arimax }}>DA</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: MODEL_COLORS.xgboost }}>XGBoost MAE</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: MODEL_COLORS.xgboost }}>DA</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: MODEL_COLORS.lstm }}>LSTM MAE</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: MODEL_COLORS.lstm }}>DA</th>
          </tr>
        </thead>
        <tbody>
          {quarters.map((q) => (
            <tr key={q.quarter} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
              <td className="py-2 px-3 font-medium">{q.quarter}</td>
              <td className="text-right py-2 px-3 text-muted-foreground">{q.n}</td>
              <td className="text-right py-2 px-3 font-mono">{formatDecimal(q.arimax.mae)}</td>
              <td className="text-right py-2 px-3 font-mono">{formatPercent(q.arimax.da, 1)}</td>
              <td className="text-right py-2 px-3 font-mono">{formatDecimal(q.xgboost.mae)}</td>
              <td className="text-right py-2 px-3 font-mono">{formatPercent(q.xgboost.da, 1)}</td>
              <td className="text-right py-2 px-3 font-mono">{formatDecimal(q.lstm.mae)}</td>
              <td className="text-right py-2 px-3 font-mono">{formatPercent(q.lstm.da, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Monthly Heatmap ---
function MonthlyHeatmap({ predictions }: { predictions: Prediction[] }) {
  const heatmapData = useMemo(() => {
    const map: Record<string, Record<string, number[]>> = {};
    for (const p of predictions) {
      const date = new Date(p.targetDate + 'T00:00:00');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!map[monthKey]) map[monthKey] = { arimax: [], xgboost: [], lstm: [] };
      map[monthKey].arimax.push(Math.abs(p.errArimax));
      map[monthKey].xgboost.push(Math.abs(p.errXgboost));
      map[monthKey].lstm.push(Math.abs(p.errLstm));
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, errors]) => ({
        month,
        label: new Date(month + '-01T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        arimax: errors.arimax.reduce((a, b) => a + b, 0) / errors.arimax.length,
        xgboost: errors.xgboost.reduce((a, b) => a + b, 0) / errors.xgboost.length,
        lstm: errors.lstm.reduce((a, b) => a + b, 0) / errors.lstm.length,
      }));
  }, [predictions]);

  const maxMAE = Math.max(...heatmapData.flatMap((d) => [d.arimax, d.xgboost, d.lstm]));

  function getHeatColor(value: number, model: string): string {
    const intensity = Math.min(value / maxMAE, 1);
    const baseColor = MODEL_COLORS[model] || '#6b7280';
    return `color-mix(in oklch, ${baseColor} ${Math.round(intensity * 80 + 20)}%, oklch(0.16 0.005 250))`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[80px_repeat(auto-fill,minmax(60px,1fr))] gap-1">
        {/* Header */}
        <div className="text-xs text-muted-foreground font-medium py-2" />
        {heatmapData.map((d) => (
          <div key={d.month} className="text-[10px] text-muted-foreground text-center py-2">{d.label}</div>
        ))}

        {/* Model rows */}
        {(['arimax', 'xgboost', 'lstm'] as const).map((model) => (
          <>
            <div key={model} className="text-xs font-medium flex items-center" style={{ color: MODEL_COLORS[model] }}>
              {MODEL_LABELS[model]}
            </div>
            {heatmapData.map((d) => {
              const value = d[model];
              return (
                <div
                  key={`${model}-${d.month}`}
                  className="h-8 rounded flex items-center justify-center text-[9px] font-mono transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: getHeatColor(value, model) }}
                  title={`${MODEL_LABELS[model]} ${d.label}: MAE ${formatDecimal(value)}`}
                >
                  {(value * 100).toFixed(1)}
                </div>
              );
            })}
          </>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Values shown as MAE × 100. Darker = higher error.</p>
    </div>
  );
}
