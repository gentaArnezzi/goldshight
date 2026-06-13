import { TestSetData, OOS2026Data } from './types';
import testSetRaw from '@/data/test_set_2024_2025.json';
import oos2026Raw from '@/data/oos_2026.json';

export function getTestSetData(): TestSetData {
  return testSetRaw as unknown as TestSetData;
}

export function getOOS2026Data(): OOS2026Data {
  return oos2026Raw as unknown as OOS2026Data;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDecimal(value: number, decimals = 4): string {
  return value.toFixed(decimals);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDataFreshnessStatus(lastUpdated: string): 'green' | 'yellow' | 'red' {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

  if (diffHours < 48) return 'green';
  if (diffHours < 168) return 'yellow'; // 7 days
  return 'red';
}

export function getQuarter(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `${date.getFullYear()}Q${q}`;
}
