import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/configure')({
  validateSearch: (s: Record<string, unknown>) => ({
    file: String(s.file ?? ''),
  }),
  component: ConfigurePage,
})

type ColumnRole =
  | 'time_axis'
  | 'primary_metric'
  | 'metric'
  | 'dimension'
  | 'filter'
  | 'ignore'

interface ColumnSummaryItem {
  name: string
  role: ColumnRole
  type: 'date' | 'number' | 'text'
}

interface DashboardTemplate {
  id: string
  icon: string
  name: string
  description: string
  requiredRoles: ColumnRole[]
  charts: string[]
}

// In production this would come from router state / store passed from /process
const DETECTED_COLUMNS: ColumnSummaryItem[] = [
  { name: 'sale_date', role: 'time_axis', type: 'date' },
  { name: 'revenue', role: 'primary_metric', type: 'number' },
  { name: 'units_sold', role: 'metric', type: 'number' },
  { name: 'deal_size', role: 'metric', type: 'number' },
  { name: 'region', role: 'dimension', type: 'text' },
  { name: 'product', role: 'dimension', type: 'text' },
  { name: 'rep_name', role: 'dimension', type: 'text' },
  { name: 'status', role: 'filter', type: 'text' },
  { name: 'notes', role: 'ignore', type: 'text' },
]

const TEMPLATES: DashboardTemplate[] = [
  {
    id: 'sales_performance',
    icon: '📈',
    name: 'Sales Performance',
    description:
      'Revenue over time, by region and rep. Includes anomaly detection on monthly dips and week-over-week trends.',
    requiredRoles: ['time_axis', 'primary_metric'],
    charts: [
      'Revenue over time',
      'By region',
      'By product',
      'Rep leaderboard',
      'Deal size trend',
    ],
  },
  {
    id: 'product_analysis',
    icon: '📦',
    name: 'Product Analysis',
    description:
      'Units sold per product, revenue per SKU, and top vs bottom performer breakdown.',
    requiredRoles: ['primary_metric', 'dimension'],
    charts: [
      'Revenue by product',
      'Units sold ranking',
      'Deal size by SKU',
      'Monthly mix',
    ],
  },
  {
    id: 'rep_performance',
    icon: '🎯',
    name: 'Rep Performance',
    description:
      'Individual rep revenue, deal counts, and a leaderboard ranked by quota attainment.',
    requiredRoles: ['primary_metric', 'dimension'],
    charts: [
      'Rep leaderboard',
      'Revenue by rep',
      'Deals closed',
      'Activity timeline',
    ],
  },
  {
    id: 'regional_breakdown',
    icon: '🗺',
    name: 'Regional Breakdown',
    description:
      'Region-by-region performance with share of total revenue and growth vs prior period.',
    requiredRoles: ['primary_metric', 'dimension'],
    charts: [
      'Revenue by region',
      'Region growth',
      'Share of total',
      'Rep coverage map',
    ],
  },
  {
    id: 'custom',
    icon: '✏️',
    name: 'Custom',
    description:
      'Start from a blank canvas and manually add the charts you want.',
    requiredRoles: [],
    charts: [],
  },
]

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All data' },
  { value: 'q3', label: 'Q3 2025' },
  { value: '90d', label: 'Last 90 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

const AI_FEATURES = [
  {
    id: 'anomaly',
    label: 'Anomaly detection',
    desc: 'Flag unusual spikes or drops automatically',
  },
  {
    id: 'insights',
    label: 'Proactive AI insights',
    desc: 'Surface trends and opportunities in the panel',
  },
  {
    id: 'report',
    label: 'Auto-generate report',
    desc: 'Write a first-pass report on dashboard load',
  },
  {
    id: 'suggest',
    label: 'Suggest additional charts',
    desc: 'Recommend charts based on your data shape',
  },
]

const ROLE_COLORS: Record<ColumnRole, string> = {
  time_axis: 'text-emerald-700',
  primary_metric: 'text-blue-700',
  metric: 'text-blue-600',
  dimension: 'text-(--sea-ink)',
  filter: 'text-amber-700',
  ignore: 'text-(--sea-ink-soft) opacity-50',
}

const ROLE_LABELS: Record<ColumnRole, string> = {
  time_axis: 'Time axis',
  primary_metric: 'Primary metric',
  metric: 'Metric',
  dimension: 'Dimension',
  filter: 'Filter',
  ignore: 'Ignored',
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: DashboardTemplate
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={[
        'w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5',
        selected
          ? 'border-(--lagoon-deep) bg-[rgba(37,99,235,0.05)] shadow-sm'
          : 'border-[rgba(23,58,64,0.14)] bg-white/70 hover:border-[rgba(37,99,235,0.3)]',
      ].join(' ')}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(23,58,64,0.06)] text-lg">
            {template.icon}
          </span>
          <span className="text-sm font-semibold text-(--sea-ink)">
            {template.name}
          </span>
        </div>
        {selected && (
          <span className="mt-0.5 shrink-0 rounded-full bg-(--lagoon-deep) px-2 py-0.5 text-xs font-semibold text-white">
            Selected
          </span>
        )}
      </div>

      <p className="mb-3 text-xs leading-relaxed text-(--sea-ink-soft)">
        {template.description}
      </p>

      {template.charts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {template.charts.map((chart) => (
            <span
              key={chart}
              className="rounded-md border border-[rgba(23,58,64,0.1)] bg-[rgba(23,58,64,0.04)] px-2 py-0.5 text-xs text-(--sea-ink-soft)"
            >
              {chart}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

function ColumnPill({ col }: { col: ColumnSummaryItem }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 odd:bg-[rgba(23,58,64,0.03)]">
      <code className="font-mono text-xs text-(--sea-ink)">{col.name}</code>
      <span className={`text-xs font-medium ${ROLE_COLORS[col.role]}`}>
        {ROLE_LABELS[col.role]}
      </span>
    </div>
  )
}

function AIFeatureToggle({
  feature,
  enabled,
  onToggle,
}: {
  feature: (typeof AI_FEATURES)[number]
  enabled: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-t border-[rgba(23,58,64,0.06)] first:border-t-0">
      <div>
        <p className="text-sm font-medium text-(--sea-ink)">{feature.label}</p>
        <p className="text-xs text-(--sea-ink-soft)">{feature.desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(feature.id)}
        className={[
          'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
          enabled ? 'bg-(--lagoon-deep)' : 'bg-[rgba(23,58,64,0.15)]',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            enabled ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

function ConfigurePage() {
  const navigate = useNavigate()
  const { file } = Route.useSearch()

  const [selectedTemplate, setSelectedTemplate] = useState('sales_performance')
  const [dateRange, setDateRange] = useState('all')
  const [aiFeatures, setAiFeatures] = useState<Record<string, boolean>>({
    anomaly: true,
    insights: true,
    report: false,
    suggest: true,
  })
  const [isBuilding, setIsBuilding] = useState(false)

  const toggleAiFeature = (id: string) =>
    setAiFeatures((prev) => ({ ...prev, [id]: !prev[id] }))

  const selectedTpl = TEMPLATES.find((t) => t.id === selectedTemplate)!

  const handleBuild = async () => {
    setIsBuilding(true)
    // In production: POST config to API, get dashboard ID back, navigate to /dashboard/:id
    await new Promise((r) => setTimeout(r, 500))
    navigate({ to: '/dashboard' })
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_66%)]" />

        <p className="island-kicker mb-3">Step 3 of 4</p>
        <h1 className="display-title mb-3 text-3xl font-bold leading-tight tracking-tight text-(--sea-ink) sm:text-4xl">
          Configure your dashboard
        </h1>
        <p className="max-w-xl text-sm text-(--sea-ink-soft) sm:text-base">
          Choose a dashboard type, set your date range, and confirm how Dash AI
          should behave. You can change all of this later.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <section
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '60ms' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="island-kicker">Dashboard type</p>
              <span className="text-xs text-(--sea-ink-soft)">Choose one</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={selectedTemplate === t.id}
                  onSelect={setSelectedTemplate}
                />
              ))}
            </div>
          </section>

          <section
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '120ms' }}
          >
            <p className="island-kicker mb-4">Date range</p>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDateRange(opt.value)}
                  className={[
                    'rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5',
                    dateRange === opt.value
                      ? 'border-(--lagoon-deep) bg-[rgba(37,99,235,0.08)] text-(--lagoon-deep)'
                      : 'border-[rgba(23,58,64,0.15)] bg-white/70 text-(--sea-ink-soft) hover:border-[rgba(37,99,235,0.3)]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-(--sea-ink-soft)">
                    From
                  </label>
                  <input
                    type="date"
                    defaultValue="2025-07-01"
                    className="rounded-xl border border-[rgba(23,58,64,0.15)] bg-white px-3 py-2 text-sm text-(--sea-ink) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
                  />
                </div>
                <span className="mt-5 text-(--sea-ink-soft)">→</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-(--sea-ink-soft)">
                    To
                  </label>
                  <input
                    type="date"
                    defaultValue="2025-09-30"
                    className="rounded-xl border border-[rgba(23,58,64,0.15)] bg-white px-3 py-2 text-sm text-(--sea-ink) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '80ms' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="island-kicker">Column roles</p>
              <Link
                to="/process"
                search={{ file }}
                className="text-xs text-(--lagoon-deep) no-underline hover:underline"
              >
                ← Edit
              </Link>
            </div>
            <div className="flex flex-col">
              {DETECTED_COLUMNS.map((col) => (
                <ColumnPill key={col.name} col={col} />
              ))}
            </div>
          </section>

          <section
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '140ms' }}
          >
            <p className="island-kicker mb-3">Dash AI features</p>
            <div className="flex flex-col">
              {AI_FEATURES.map((feature) => (
                <AIFeatureToggle
                  key={feature.id}
                  feature={feature}
                  enabled={aiFeatures[feature.id]}
                  onToggle={toggleAiFeature}
                />
              ))}
            </div>
          </section>

          <section
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '180ms' }}
          >
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.05)] px-3.5 py-3">
              <span className="mt-0.5 text-base">{selectedTpl.icon}</span>
              <div>
                <p className="text-sm font-semibold text-(--sea-ink)">
                  {selectedTpl.name}
                </p>
                <p className="mt-0.5 text-xs text-(--sea-ink-soft)">
                  {DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label}{' '}
                  · {Object.values(aiFeatures).filter(Boolean).length} AI
                  features on
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isBuilding}
              onClick={handleBuild}
              className={[
                'mb-2 w-full rounded-2xl py-3.5 text-sm font-semibold transition',
                !isBuilding
                  ? 'bg-(--lagoon-deep) text-white hover:opacity-90 hover:-translate-y-0.5'
                  : 'cursor-not-allowed bg-[rgba(23,58,64,0.07)] text-(--sea-ink-soft)',
              ].join(' ')}
            >
              {isBuilding ? 'Building dashboard…' : 'Build my dashboard →'}
            </button>

            <Link
              to="/process"
              search={{ file }}
              className="block w-full rounded-2xl border border-[rgba(23,58,64,0.15)] py-3 text-center text-sm font-medium text-(--sea-ink-soft) no-underline transition hover:bg-[rgba(23,58,64,0.04)]"
            >
              ← Back to column setup
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
