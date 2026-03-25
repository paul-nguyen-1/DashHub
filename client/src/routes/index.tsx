import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: LandingPage })

const STEPS = [
  {
    icon: '📂',
    step: '01',
    title: 'Upload your CSV',
    description:
      'Drop any company CSV file. Sales data, HR records, inventory — anything with headers.',
  },
  {
    icon: '✦',
    step: '02',
    title: 'AI reads your columns',
    description:
      'Dash automatically detects metrics, dimensions, and date axes. No manual mapping needed.',
  },
  {
    icon: '📊',
    step: '03',
    title: 'Dashboard built instantly',
    description:
      'Charts, KPIs, and anomaly detection are ready the moment your file finishes uploading.',
  },
  {
    icon: '📄',
    step: '04',
    title: 'AI writes the report',
    description:
      'Ask Dash a question or click "Generate report" — it writes the full analysis for you.',
  },
]

const FEATURES = [
  {
    title: 'Zero setup',
    description:
      'No schema definitions, no database config, no chart builder. Upload and go.',
  },
  {
    title: 'Anomaly detection',
    description:
      'Dash scans every upload for unusual patterns and surfaces them before you ask.',
  },
  {
    title: 'Plain-English queries',
    description:
      'Type "why did revenue drop in September?" and get a cited, data-backed answer.',
  },
  {
    title: 'One-click reports',
    description:
      'Export a full AI-written PDF report with charts, findings, and recommendations.',
  },
]

function LandingPage() {
  return (
    <main className="page-wrap px-4 pb-16 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-12 sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.12),transparent_66%)]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-linear-to-r from-transparent via-[rgba(37,99,235,0.2)] to-transparent" />

        <p className="island-kicker mb-4">
          CSV → Instant dashboards → AI reports
        </p>

        <h1 className="display-title mb-6 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-(--sea-ink) sm:text-6xl">
          Your company data,{' '}
          <span className="text-(--lagoon-deep)">understood instantly.</span>
        </h1>

        <p className="mb-10 max-w-2xl text-base text-(--sea-ink-soft) sm:text-lg">
          Upload any CSV and DashHub auto-builds dashboards, detects anomalies,
          and generates AI-written reports — no setup, no code, no waiting.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-full bg-(--lagoon-deep) px-6 py-2.5 text-sm font-semibold text-white! no-underline transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Upload a CSV →
          </Link>
          <Link
            to="/"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-6 py-2.5 text-sm font-semibold text-(--sea-ink) no-underline transition hover:-translate-y-0.5 hover:border-[rgba(23,58,64,0.35)]"
          >
            Try sample data
          </Link>
        </div>

        <p className="mt-8 text-xs text-(--sea-ink-soft) opacity-60">
          Works with any CSV export from Excel, Google Sheets, your CRM, or ERP.
        </p>
      </section>

      <section className="mt-10">
        <p className="island-kicker mb-6 text-center">How it works</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon, step, title, description }, i) => (
            <article
              key={step}
              className="island-shell feature-card rise-in relative overflow-hidden rounded-2xl p-5"
              style={{ animationDelay: `${i * 80 + 60}ms` }}
            >
              <span className="pointer-events-none absolute right-4 top-3 font-mono text-4xl font-bold leading-none text-(--sea-ink) opacity-[0.20] select-none">
                {step}
              </span>

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.08)] text-xl">
                {icon}
              </div>
              <h2 className="mb-1.5 text-sm font-semibold text-(--sea-ink)">
                {title}
              </h2>
              <p className="m-0 text-sm leading-relaxed text-(--sea-ink-soft)">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ title, description }, i) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${i * 90 + 380}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-(--sea-ink)">
              {title}
            </h2>
            <p className="m-0 text-sm text-(--sea-ink-soft)">{description}</p>
          </article>
        ))}
      </section>

      <section
        className="island-shell rise-in mt-6 overflow-hidden rounded-2xl p-6"
        style={{ animationDelay: '760ms' }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="island-kicker mb-1">Not sure where to start?</p>
            <p className="text-sm text-(--sea-ink-soft)">
              Try DashHub with one of our built-in sample datasets — no file
              needed.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {[
                'Sales Q3 2025 · 2,418 rows',
                'HR Headcount · 582 rows',
                'Inventory · 1,104 rows',
              ].map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.06)] px-3 py-1 text-xs font-medium text-(--lagoon-deep)"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to="/"
            className="shrink-0 rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-(--lagoon-deep) no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Explore sample data →
          </Link>
        </div>
      </section>
    </main>
  )
}
