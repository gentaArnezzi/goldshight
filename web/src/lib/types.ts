// TypeScript types for GoldSight data
export interface Prediction {
  observationDate: string;
  targetDate: string;
  actual: number;
  predArimax: number;
  predXgboost: number;
  predLstm: number;
  errArimax: number;
  errXgboost: number;
  errLstm: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  da: number;
}

export interface Metrics {
  arimax: ModelMetrics;
  xgboost: ModelMetrics;
  lstm: ModelMetrics;
  zeroBenchmark: ModelMetrics;
  persistenceBenchmark: ModelMetrics;
}

export interface SignificanceTest {
  comparison: string;
  modelA: string;
  modelB: string;
  lossType: string;
  meanLossDiff: number;
  dmStat: number;
  dmPvalue: number;
  wilcoxonPvalue: number;
  n: number;
  significant: boolean;
  conclusion: string;
}

export interface AblationResult {
  model: string;
  package: string;
  features: string;
  mae: number;
  rmse: number;
  da: number;
  numFeatures: number | null;
  maeRank: number;
  rmseRank: number;
  daRank: number;
}

export interface ModelConfiguration {
  model: string;
  target: string;
  selectedPackage: string;
  configuration: string;
  selectedFeatures: string;
  validationMAE: number;
  validationRMSE: number;
  validationDA: number;
}

export interface SplitSummary {
  split: string;
  rows: number;
  startDate: string;
  endDate: string;
  startTargetDate: string;
  endTargetDate: string;
  positiveTargetRatio: number;
}

export interface TestSetData {
  generatedAt: string;
  predictions: Prediction[];
  metrics: Metrics;
  significanceTests: SignificanceTest[];
  ablationResults: AblationResult[];
  configurations: ModelConfiguration[];
  splitSummary: SplitSummary[];
  meta: {
    totalObservations: number;
    testPeriod: { start: string; end: string };
    models: string[];
    benchmarks: string[];
  };
}

export interface OOSPrediction {
  observationDate: string;
  targetDate: string;
  actual: number | null;
  predXgboost: number;
  predLstm: number;
  errXgboost: number | null;
  errLstm: number | null;
}

export interface OOS2026Data {
  lastUpdated: string;
  dataAsOf: string;
  predictions: OOSPrediction[];
  aggregateMetrics: {
    nObservations: number;
    xgboost: ModelMetrics | { mae: null; rmse: null; da: null };
    lstm: ModelMetrics | { mae: null; rmse: null; da: null };
  };
}

// Chart display helpers
export type ModelKey = 'arimax' | 'xgboost' | 'lstm';
export type BenchmarkKey = 'zeroBenchmark' | 'persistenceBenchmark';

export const MODEL_COLORS: Record<string, string> = {
  arimax: '#ef4444',    // red
  xgboost: '#f59e0b',   // amber/gold
  lstm: '#8b5cf6',      // purple
  actual: '#22c55e',    // green
  zero: '#6b7280',      // gray
  persistence: '#94a3b8', // slate
};

export const MODEL_LABELS: Record<string, string> = {
  arimax: 'ARIMAX',
  xgboost: 'XGBoost',
  lstm: 'LSTM',
  actual: 'Actual',
  zeroBenchmark: 'Zero Benchmark',
  persistenceBenchmark: 'Persistence',
};
