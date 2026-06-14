import { AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30">
      {/* Disclaimer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground/80">Academic Disclaimer:</strong>{' '}
            GoldSight is an academic output from a thesis research project. The prediction results displayed are{' '}
            <strong>not intended as investment recommendations</strong>, trading signals, or any form of financial decision-making assistance.
            This research concludes that predicting 5-day gold returns is a difficult problem with limited improvement over simple benchmarks.
          </p>
        </div>

        {/* Footer content */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-gold-gradient font-semibold">GoldSight</span>
            <span>·</span>
            <span>Thesis Research Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Afzie M. Nurlan & Irgya G. Arnezzi</span>
            <span>·</span>
            <span>Binus University</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
