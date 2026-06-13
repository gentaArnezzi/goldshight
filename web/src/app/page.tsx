'use client';

import { TrendingUp, TrendingDown, Target, BarChart3, ArrowRight, LineChart, Activity, FlaskConical, Info } from 'lucide-react';
import Link from 'next/link';
import { getTestSetData, getOOS2026Data, formatDecimal, formatPercent, formatDate } from '@/lib/data';
import { MODEL_COLORS } from '@/lib/types';

export default function HomePage() {
  const data = getTestSetData();
  const { metrics } = data;
  const oos = getOOS2026Data();

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
            Thesis Research Dashboard
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-gold-gradient">GoldSight</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-3 leading-relaxed">
            Comparing <span className="text-foreground font-medium">ARIMAX</span>,{' '}
            <span className="text-foreground font-medium">XGBoost</span>, and{' '}
            <span className="text-foreground font-medium">LSTM</span> for
            5-Day Cumulative Gold Return Prediction
          </p>

          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Interactive visualization of thesis results on the test set (2024–2025)
            with out-of-sample replay on 2026 data.
          </p>

          {oos.lastUpdated && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              2026 data last updated: {formatDate(oos.dataAsOf || oos.lastUpdated)}
              <span className="text-muted-foreground/40">·</span>
              {oos.aggregateMetrics.nObservations} evaluated predictions
            </div>
          )}
        </section>

        {/* Key Conclusion Card */}
        <section className="mb-12">
          <div className="glass-card-gold rounded-2xl p-6 sm:p-8 glow-gold animate-shimmer">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Key Research Conclusion</h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">LSTM ≈ XGBoost</strong> statistically — both significantly
                  outperform ARIMAX. However, <strong className="text-foreground">only XGBoost</strong> is
                  robustly superior to the zero benchmark (DM-test significant at 5%). Predicting 5-day
                  gold returns remains a <strong className="text-foreground">difficult problem</strong> with
                  limited improvement over simple benchmarks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Test Set Performance (2024–2025)
            <span className="text-sm font-normal text-muted-foreground ml-2">503 observations</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <MetricCard
              model="LSTM"
              color={MODEL_COLORS.lstm}
              metrics={metrics.lstm}
              rank={{ mae: 1, rmse: 2, da: 2 }}
              badge="Lowest MAE"
            />
            <MetricCard
              model="XGBoost"
              color={MODEL_COLORS.xgboost}
              metrics={metrics.xgboost}
              rank={{ mae: 2, rmse: 1, da: 1 }}
              badge="Best Overall"
              featured
            />
            <MetricCard
              model="ARIMAX"
              color={MODEL_COLORS.arimax}
              metrics={metrics.arimax}
              rank={{ mae: 3, rmse: 3, da: 3 }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BenchmarkCard
              name="Zero Benchmark"
              description="Predicts 0 (no change)"
              metrics={metrics.zeroBenchmark}
            />
            <BenchmarkCard
              name="Persistence"
              description="Predicts previous return"
              metrics={metrics.persistenceBenchmark}
            />
          </div>
        </section>

        {/* Significance Summary */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Statistical Significance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SignificanceCard
              comparison="LSTM vs XGBoost"
              pValue={0.984}
              significant={false}
              conclusion="Not significantly different"
            />
            <SignificanceCard
              comparison="LSTM vs ARIMAX"
              pValue={0.009}
              significant={true}
              conclusion="LSTM significantly better"
            />
            <SignificanceCard
              comparison="XGBoost vs Zero"
              pValue={0.001}
              significant={true}
              conclusion="XGBoost significantly better"
            />
          </div>
        </section>

        {/* Navigation Cards */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Explore the Research</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <NavCard
              href="/test-results"
              icon={LineChart}
              title="Test Results"
              description="Interactive timeline, drill-down analysis, and diagnostic plots for 2024–2025"
            />
            <NavCard
              href="/replay-2026"
              icon={Activity}
              title="Replay 2026"
              description="Out-of-sample validation on 2026 data with live metrics"
            />
            <NavCard
              href="/ablation"
              icon={FlaskConical}
              title="Ablation Study"
              description="Feature group contribution analysis across all models"
            />
            <NavCard
              href="/about"
              icon={Info}
              title="About"
              description="Methodology, limitations, and full academic disclaimer"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Sub-components ---

function MetricCard({
  model,
  color,
  metrics,
  rank,
  badge,
  featured,
}: {
  model: string;
  color: string;
  metrics: { mae: number; rmse: number; da: number };
  rank: { mae: number; rmse: number; da: number };
  badge?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`
        relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]
        ${featured ? 'glass-card-gold glow-gold' : 'glass-card'}
      `}
    >
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
            {badge}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-lg font-semibold">{model}</h3>
      </div>

      <div className="space-y-3">
        <MetricRow label="MAE" value={formatDecimal(metrics.mae)} rank={rank.mae} />
        <MetricRow label="RMSE" value={formatDecimal(metrics.rmse)} rank={rank.rmse} />
        <MetricRow label="DA" value={formatPercent(metrics.da, 1)} rank={rank.da} positive />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  rank,
  positive,
}: {
  label: string;
  value: string;
  rank: number;
  positive?: boolean;
}) {
  const rankColors: Record<number, string> = {
    1: 'text-primary',
    2: 'text-muted-foreground',
    3: 'text-muted-foreground/60',
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-medium">{value}</span>
        <span className={`text-[10px] font-bold ${rankColors[rank] || 'text-muted-foreground/40'}`}>
          #{rank}
        </span>
      </div>
    </div>
  );
}

function BenchmarkCard({
  name,
  description,
  metrics,
}: {
  name: string;
  description: string;
  metrics: { mae: number; rmse: number; da: number };
}) {
  return (
    <div className="glass-card rounded-2xl p-5 opacity-80">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground/60">{description}</p>
        </div>
        <BarChart3 className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <div className="flex items-center gap-6 text-xs font-mono">
        <span>MAE: {formatDecimal(metrics.mae)}</span>
        <span>RMSE: {formatDecimal(metrics.rmse)}</span>
        <span>DA: {formatPercent(metrics.da, 1)}</span>
      </div>
    </div>
  );
}

function SignificanceCard({
  comparison,
  pValue,
  significant,
  conclusion,
}: {
  comparison: string;
  pValue: number;
  significant: boolean;
  conclusion: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center gap-2 mb-2">
        {significant ? (
          <TrendingUp className="h-4 w-4 text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-muted-foreground/60" />
        )}
        <span className="text-sm font-semibold">{comparison}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{conclusion}</p>
      <span className={`text-xs font-mono ${significant ? 'text-green-400' : 'text-muted-foreground/60'}`}>
        p = {pValue.toFixed(3)}
      </span>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group glass-card rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
      <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Explore <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
