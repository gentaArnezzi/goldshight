import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ablation Study',
  description: 'Feature group contribution analysis for ARIMAX, XGBoost, and LSTM models. Comparing FULL, NO_G1, NO_G2, NO_G3, and GOLD_ONLY feature packages.',
};

export default function AblationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
