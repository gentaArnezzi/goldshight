import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Replay 2026',
  description: 'Out-of-sample validation of XGBoost and LSTM gold return predictions on 2026 data. Empirical observation beyond the official test period.',
};

export default function Replay2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
