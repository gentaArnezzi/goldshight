#!/usr/bin/env node
/**
 * prepare-data.js
 * Converts notebook CSV outputs into the JSON schema defined in the PRD.
 * Run: node scripts/prepare-data.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUTS_DIR = path.join(__dirname, '..', 'Jupyter Notebooks', 'Outputs');
const DATA_DIR = path.join(__dirname, '..', 'web', 'src', 'data');

// Ensure output directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- CSV Parsing Utility ---
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/\r/g, '');
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  // Handle quoted fields with commas inside
  function splitCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      const val = values[idx] || '';
      // Try to parse as number
      if (val !== '' && !isNaN(Number(val))) {
        row[h] = Number(val);
      } else {
        row[h] = val;
      }
    });
    rows.push(row);
  }
  return rows;
}

// --- 1. Build test_set_2024_2025.json ---
function buildTestSetJSON() {
  console.log('Building test_set_2024_2025.json...');

  // Parse combined predictions
  const predictions = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '09_combined_test_predictions.csv')
  );

  // Group predictions by date (each date has 3 models)
  const dateMap = {};
  for (const row of predictions) {
    const key = row.DATE;
    if (!dateMap[key]) {
      dateMap[key] = {
        observationDate: row.DATE,
        targetDate: row.TARGET_DATE,
        actual: row.TARGET_5D,
      };
    }
    const model = row.Model;
    if (model === 'ARIMAX') {
      dateMap[key].predArimax = row.PRED;
      dateMap[key].errArimax = row.ERROR;
    } else if (model === 'XGBoost') {
      dateMap[key].predXgboost = row.PRED;
      dateMap[key].errXgboost = row.ERROR;
    } else if (model === 'LSTM') {
      dateMap[key].predLstm = row.PRED;
      dateMap[key].errLstm = row.ERROR;
    }
  }

  const predictionArray = Object.values(dateMap).sort(
    (a, b) => a.observationDate.localeCompare(b.observationDate)
  );

  // Parse model comparison metrics
  const modelComparison = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '07_final_test_model_comparison.csv')
  );

  // Parse benchmark comparison
  const benchmarkComparison = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '08_final_comparison_with_benchmark.csv')
  );

  const metrics = {};
  for (const row of benchmarkComparison) {
    const key = row.Model.toLowerCase();
    metrics[key === 'zero' ? 'zeroBenchmark' : key === 'persistence' ? 'persistenceBenchmark' : key] = {
      mae: row.MAE,
      rmse: row.RMSE,
      da: row.DA,
    };
  }

  // Parse significance tests
  const sigTests = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '10_significance_tests.csv')
  );

  const significanceTests = sigTests.map(row => ({
    comparison: row.Comparison,
    modelA: row.Model_A,
    modelB: row.Model_B,
    lossType: row.Loss_Type,
    meanLossDiff: row.Mean_Loss_Diff_A_minus_B,
    dmStat: row.DM_Stat,
    dmPvalue: row.DM_p_value,
    wilcoxonPvalue: row.Wilcoxon_p_value,
    n: row.N,
    significant: row.Significant_5pct === 'True',
    conclusion: row.Conclusion,
  }));

  // Parse ablation results
  const ablation = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '05_stage_b_ablation_combined.csv')
  );

  const ablationResults = ablation.map(row => ({
    model: row.Model,
    package: row.package,
    features: row.features || '',
    mae: row.MAE,
    rmse: row.RMSE,
    da: row.DA,
    numFeatures: row.num_features || null,
    maeRank: row.MAE_Rank,
    rmseRank: row.RMSE_Rank,
    daRank: row.DA_Rank,
  }));

  // Parse model configuration
  const modelConfig = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '04_model_configuration_summary.csv')
  );

  const configurations = modelConfig.map(row => ({
    model: row.Model,
    target: row.Target,
    selectedPackage: row.Selected_Package,
    configuration: row.Configuration,
    selectedFeatures: row.Selected_Features,
    validationMAE: row.Validation_MAE,
    validationRMSE: row.Validation_RMSE,
    validationDA: row.Validation_DA,
  }));

  // Parse split summary
  const splits = parseCSV(
    path.join(OUTPUTS_DIR, 'project_summary', '01_split_summary.csv')
  );

  const splitSummary = splits.map(row => ({
    split: row.SPLIT,
    rows: row.Rows,
    startDate: row.Start_DATE,
    endDate: row.End_DATE,
    startTargetDate: row.Start_TARGET_DATE,
    endTargetDate: row.End_TARGET_DATE,
    positiveTargetRatio: row.Positive_Target_Ratio,
  }));

  const result = {
    generatedAt: new Date().toISOString(),
    predictions: predictionArray,
    metrics,
    significanceTests,
    ablationResults,
    configurations,
    splitSummary,
    meta: {
      totalObservations: predictionArray.length,
      testPeriod: { start: '2024-01-02', end: '2025-12-30' },
      models: ['ARIMAX', 'XGBoost', 'LSTM'],
      benchmarks: ['ZERO', 'PERSISTENCE'],
    }
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'test_set_2024_2025.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`  ✅ ${predictionArray.length} prediction dates written`);
  console.log(`  ✅ ${significanceTests.length} significance tests written`);
  console.log(`  ✅ ${ablationResults.length} ablation results written`);
}

// --- 2. Build mock oos_2026.json ---
function buildOOS2026JSON() {
  console.log('Building oos_2026.json (placeholder)...');

  const result = {
    lastUpdated: new Date().toISOString(),
    dataAsOf: '2026-06-12',
    predictions: [],
    aggregateMetrics: {
      nObservations: 0,
      xgboost: { mae: null, rmse: null, da: null },
      lstm: { mae: null, rmse: null, da: null },
    },
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'oos_2026.json'),
    JSON.stringify(result, null, 2)
  );

  console.log('  ✅ Placeholder 2026 data written');
}

// --- Run ---
buildTestSetJSON();
buildOOS2026JSON();
console.log('\n🎉 Data preparation complete!');
