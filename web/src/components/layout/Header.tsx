'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, LineChart, FlaskConical, Info, Home, Activity } from 'lucide-react';
import { getOOS2026Data, getDataFreshnessStatus, formatDate } from '@/lib/data';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/test-results', label: 'Test Results 2024–2025', icon: LineChart },
  { href: '/replay-2026', label: 'Replay 2026', icon: Activity },
  { href: '/ablation', label: 'Ablation Study', icon: FlaskConical },
  { href: '/about', label: 'About', icon: Info },
];

const FRESHNESS_CONFIG = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400', text: 'text-green-300' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400', text: 'text-yellow-300' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400', text: 'text-red-300' },
} as const;

export default function Header() {
  const pathname = usePathname();
  const oos = getOOS2026Data();
  const freshness = oos.lastUpdated ? getDataFreshnessStatus(oos.lastUpdated) : null;
  const cfg = freshness ? FRESHNESS_CONFIG[freshness] : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-card">
      {/* Data Freshness Banner */}
      {cfg && oos.lastUpdated && (
        <div className={`${cfg.bg} border-b ${cfg.border} px-4 py-1.5`}>
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 text-xs">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            <span className={cfg.text}>
              2026 data last updated: {formatDate(oos.dataAsOf || oos.lastUpdated)}
              {freshness === 'red' && ' — Data may be stale'}
              {freshness === 'yellow' && ' — Update pending'}
            </span>
          </div>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:glow-gold transition-all duration-300">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-gold-gradient">GoldSight</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'text-primary bg-primary/10 border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <MobileMenu pathname={pathname} />
      </div>
    </header>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <div className="md:hidden">
      <details className="relative">
        <summary className="list-none cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </summary>
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl glass-card border border-border p-2 shadow-xl">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}
