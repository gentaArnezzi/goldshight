import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Results 2024–2025',
  description: 'Interactive visualization of ARIMAX, XGBoost, and LSTM prediction results on the test set (2024–2025). Timeline, drill-down, error distribution, and significance tests.',
};

export default function TestResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
