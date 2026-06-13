import { AlertTriangle, BookOpen, Code2, Mail, ExternalLink } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">
          About <span className="text-gold-gradient">GoldSight</span>
        </h1>
        <p className="text-muted-foreground">
          Methodology, limitations, and academic context
        </p>
      </div>

      {/* Methodology */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Research Methodology</h2>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            This thesis compares three forecasting approaches — <strong className="text-foreground">ARIMAX</strong>{' '}
            (Autoregressive Integrated Moving Average with Exogenous Variables), <strong className="text-foreground">XGBoost</strong>{' '}
            (Extreme Gradient Boosting), and <strong className="text-foreground">LSTM</strong>{' '}
            (Long Short-Term Memory) — for predicting the 5-day cumulative return of gold (GLD ETF).
          </p>

          <p>
            The study employs a <strong className="text-foreground">walk-forward validation</strong> framework on
            daily data spanning January 2010 to December 2025. The data is divided into training (2010–2022),
            validation (2023), and test (2024–2025) periods, with 503 test observations.
          </p>

          <p>
            Five macroeconomic exogenous variables are used as features: US Dollar Index (DXY) return,
            S&P 500 return, crude oil futures return, 10-year US Treasury yield change, and VIX level.
            An <strong className="text-foreground">ablation study</strong> systematically removes feature groups
            to assess their individual contributions.
          </p>

          <p>
            Model evaluation uses Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Direction
            Accuracy (DA). Statistical significance is assessed via the Diebold-Mariano (DM) test with
            Newey-West correction and the Wilcoxon signed-rank test. Two benchmarks are used: the zero
            prediction (predicts no change) and the persistence prediction (predicts previous return).
          </p>

          <p>
            The final selected configurations are: ARIMAX(0,0,1) with FULL features, XGBoost with NO_G3
            features (40 lagged columns), and LSTM with NO_G3 features (MEDIUM architecture, Huber loss,
            window size 7).
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">Limitations</h2>

        <div className="space-y-3">
          {[
            {
              title: 'Single Market Regime',
              description:
                'The test period (2024–2025) predominantly covers a bull market for gold. Model performance may differ significantly under bear or sideways markets.',
            },
            {
              title: 'Limited Test Sample',
              description:
                'While 503 observations provide reasonable statistical power for aggregate metrics, performance can vary substantially across sub-periods.',
            },
            {
              title: 'Weak Feature Signals',
              description:
                'The exogenous features show limited predictive power for 5-day returns. The marginal improvement over the zero benchmark is small in absolute terms.',
            },
            {
              title: 'Walk-Forward Asymmetry',
              description:
                'ARIMAX is re-estimated at each step, while XGBoost and LSTM use fixed models trained on the training set. This gives ARIMAX an adaptive advantage but also makes direct comparison less straightforward.',
            },
            {
              title: 'No Transaction Costs',
              description:
                'The evaluation considers prediction accuracy only, not practical trading profitability after accounting for transaction costs, slippage, and market impact.',
            },
            {
              title: 'Horizon Specificity',
              description:
                'Results are specific to the 5-day prediction horizon. Different horizons (daily, weekly, monthly) may yield substantially different relative model performance.',
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0">
              <span className="text-primary font-bold text-sm mt-0.5">{i + 1}.</span>
              <div>
                <h3 className="font-medium text-sm text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full Disclaimer */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
          <h2 className="text-xl font-semibold text-amber-200">Academic Disclaimer</h2>
        </div>

        <div className="space-y-3 text-sm text-amber-200/80 leading-relaxed">
          <p>
            GoldSight is an academic output from a thesis research project in the Computer Science program.
            The prediction results displayed are <strong className="text-amber-200">not intended as
            investment recommendations</strong>, trading signals, or any form of financial decision-making
            assistance.
          </p>

          <p>
            This research concludes that predicting 5-day gold returns is a difficult problem with limited
            improvement over simple benchmarks. The models evaluated do not demonstrate the level of
            accuracy or consistency required for practical trading applications.
          </p>

          <p>
            The out-of-sample replay on 2026 data is provided purely for empirical observation and has
            insufficient sample size for formal statistical conclusions. Users should not interpret any
            displayed results as evidence of model viability for trading purposes.
          </p>

          <p>
            <strong className="text-amber-200">Past performance does not indicate future results.</strong>{' '}
            Financial markets are inherently unpredictable and model performance can degrade
            substantially under changing market conditions.
          </p>
        </div>
      </section>

      {/* Links */}
      <section className="glass-card rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-4">Links & References</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LinkCard
            icon={Code2}
            title="GitHub Repository"
            description="Source code and data pipeline"
            href="https://github.com"
            external
          />
          <LinkCard
            icon={BookOpen}
            title="Thesis PDF"
            description="Full thesis document"
            href="#"
            disabled
            disabledText="Available after publication"
          />
          <LinkCard
            icon={Mail}
            title="Contact"
            description="Research inquiries"
            href="mailto:ji@example.com"
          />
          <LinkCard
            icon={ExternalLink}
            title="Data Source"
            description="Yahoo Finance (GLD, DX-Y.NYB, ^GSPC, CL=F, ^TNX, ^VIX)"
            href="https://finance.yahoo.com"
            external
          />
        </div>
      </section>
    </div>
  );
}

function LinkCard({
  icon: Icon,
  title,
  description,
  href,
  external,
  disabled,
  disabledText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  disabled?: boolean;
  disabledText?: string;
}) {
  if (disabled) {
    return (
      <div className="flex items-start gap-3 rounded-xl p-4 bg-muted/20 opacity-50 cursor-not-allowed">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{disabledText || description}</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-start gap-3 rounded-xl p-4 bg-muted/10 hover:bg-muted/20 transition-colors group"
    >
      <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div>
        <h3 className="text-sm font-medium group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </a>
  );
}
