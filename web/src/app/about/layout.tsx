import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About & Limitations',
  description: 'Research methodology, limitations, and academic disclaimer for the GoldSight gold return prediction thesis dashboard.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
