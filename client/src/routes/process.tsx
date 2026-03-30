import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { api, type Column } from '@/lib/api'

export const Route = createFileRoute('/process')({
  validateSearch: (s: Record<string, unknown>) => ({
    file: String(s.file ?? ''),
    file_id: s.file_id ? String(s.file_id) : undefined,
  }),
  component: ProcessPage,
})

type ColumnType = 'date' | 'number' | 'text' | 'boolean'
type ColumnRole =
  | 'time_axis'
  | 'primary_metric'
  | 'metric'
  | 'dimension'
  | 'filter'
  | 'ignore'

interface DetectedColumn {
  name: string
  type: ColumnType
  role: ColumnRole
  samples: string[]
  nullable: boolean
}

type StepStatus = 'done' | 'active' | 'wait'

interface AnalysisStep {
  id: number
  label: string
  status: StepStatus
}

const ROLE_LABELS: Record<ColumnRole, string> = {
  time_axis: 'Time axis',
  primary_metric: 'Primary metric',
  metric: 'Metric',
  dimension: 'Dimension',
  filter: 'Filter only',
  ignore: 'Ignore',
}

const ROLE_OPTIONS: ColumnRole[] = [
  'time_axis',
  'primary_metric',
  'metric',
  'dimension',
  'filter',
  'ignore',
]

const TYPE_STYLES: Record<ColumnType, string> = {
  date: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  number: 'bg-blue-50 text-blue-700 border border-blue-200',
  text: 'bg-[rgba(23,58,64,0.06)] text-[var(--sea-ink-soft)] border border-[rgba(23,58,64,0.12)]',
  boolean: 'bg-amber-50 text-amber-700 border border-amber-200',
}

const INITIAL_COLUMNS: DetectedColumn[] = [
  {
    name: 'sale_date',
    type: 'date',
    role: 'time_axis',
    samples: ['2025-07-01', '2025-07-02', '2025-07-03'],
    nullable: false,
  },
  {
    name: 'revenue',
    type: 'number',
    role: 'primary_metric',
    samples: ['4,200', '3,870', '5,100'],
    nullable: false,
  },
  {
    name: 'units_sold',
    type: 'number',
    role: 'metric',
    samples: ['120', '98', '143'],
    nullable: false,
  },
  {
    name: 'region',
    type: 'text',
    role: 'dimension',
    samples: ['North', 'South', 'West'],
    nullable: false,
  },
  {
    name: 'product',
    type: 'text',
    role: 'dimension',
    samples: ['Widget A', 'Widget B', 'Widget C'],
    nullable: false,
  },
  {
    name: 'rep_name',
    type: 'text',
    role: 'dimension',
    samples: ['J. Smith', 'R. Patel', 'M. Lee'],
    nullable: false,
  },
  {
    name: 'deal_size',
    type: 'number',
    role: 'metric',
    samples: ['67.30', '42.00', '89.50'],
    nullable: false,
  },
  {
    name: 'status',
    type: 'text',
    role: 'filter',
    samples: ['Closed', 'Open', 'Lost'],
    nullable: true,
  },
  {
    name: 'notes',
    type: 'text',
    role: 'ignore',
    samples: ['Follow up', '—', 'Urgent'],
    nullable: true,
  },
]

function assignDefaultRoles(cols: Column[]): DetectedColumn[] {
  let hasTimeAxis = false
  let hasPrimaryMetric = false
  return cols.map((col) => {
    let role: ColumnRole
    if (col.type === 'date' && !hasTimeAxis) {
      role = 'time_axis'
      hasTimeAxis = true
    } else if (col.type === 'number' && !hasPrimaryMetric) {
      role = 'primary_metric'
      hasPrimaryMetric = true
    } else if (col.type === 'number') {
      role = 'metric'
    } else if (col.type === 'boolean') {
      role = 'filter'
    } else {
      role = 'dimension'
    }
    return {
      name: col.name,
      type: col.type,
      role,
      samples: col.sample_values,
      nullable: col.null_count > 0,
    }
  })
}

const INITIAL_STEPS: AnalysisStep[] = [
  { id: 1, label: 'File uploaded and parsed — 0 errors', status: 'done' },
  {
    id: 2,
    label: '9 columns detected · date column found: sale_date',
    status: 'done',
  },
  {
    id: 3,
    label: 'Numeric columns identified: revenue, units_sold, deal_size',
    status: 'done',
  },
  {
    id: 4,
    label: 'AI inferring metrics, dimensions, and KPI roles…',
    status: 'active',
  },
  { id: 5, label: 'Running anomaly pre-scan', status: 'wait' },
  { id: 6, label: 'Building your dashboard', status: 'wait' },
]

function useProgressSimulation(onComplete: () => void) {
  const [progress, setProgress] = useState(0)
  const [steps, setSteps] = useState<AnalysisStep[]>(INITIAL_STEPS)
  const [showColumns, setShowColumns] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        const increment = prev < 70 ? 2.2 : prev < 85 ? 1 : 2.8
        return Math.min(prev + increment, 100)
      })
    }, 60)

    const colTimer = setTimeout(() => setShowColumns(true), 1800)

    const s1 = setTimeout(
      () =>
        setSteps((s) =>
          s.map((st) =>
            st.id === 4
              ? { ...st, status: 'done' }
              : st.id === 5
                ? { ...st, status: 'active' }
                : st,
          ),
        ),
      1400,
    )

    const s2 = setTimeout(
      () =>
        setSteps((s) =>
          s.map((st) =>
            st.id === 5
              ? { ...st, status: 'done' }
              : st.id === 6
                ? { ...st, status: 'active' }
                : st,
          ),
        ),
      2100,
    )

    const s3 = setTimeout(() => {
      setSteps((s) => s.map((st) => ({ ...st, status: 'done' as StepStatus })))
      onComplete()
    }, 2800)

    return () => {
      clearInterval(interval)
      clearTimeout(colTimer)
      clearTimeout(s1)
      clearTimeout(s2)
      clearTimeout(s3)
    }
  }, [onComplete])

  return { progress, steps, showColumns }
}

function StepIndicator({ step }: { step: AnalysisStep }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
          step.status === 'done' ? 'bg-emerald-100 text-emerald-700' : '',
          step.status === 'active'
            ? 'bg-blue-100 text-blue-600 animate-pulse'
            : '',
          step.status === 'wait'
            ? 'bg-[rgba(23,58,64,0.06)] text-(--sea-ink-soft)'
            : '',
        ].join(' ')}
      >
        {step.status === 'done' ? '✓' : step.id}
      </div>
      <span
        className={[
          'text-sm transition-colors duration-300',
          step.status === 'done' ? 'font-medium text-(--sea-ink)' : '',
          step.status === 'active' ? 'font-medium text-blue-600' : '',
          step.status === 'wait' ? 'text-(--sea-ink-soft) opacity-50' : '',
        ].join(' ')}
      >
        {step.label}
      </span>
    </div>
  )
}

function TypePill({ type }: { type: ColumnType }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[type]}`}
    >
      {type}
    </span>
  )
}

function RoleSelect({
  role,
  onChange,
}: {
  role: ColumnRole
  onChange: (r: ColumnRole) => void
}) {
  return (
    <select
      value={role}
      onChange={(e) => onChange(e.target.value as ColumnRole)}
      className="rounded-lg border border-[rgba(23,58,64,0.16)] bg-[rgba(23,58,64,0.03)] px-2.5 py-1.5 text-xs text-(--sea-ink) transition hover:border-(--lagoon-deep) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
    >
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  )
}

function AIInsightBox() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800">
      <span className="mt-0.5 shrink-0 text-base">✦</span>
      <p className="leading-relaxed">
        <strong>Dash detected:</strong> this looks like sales data. I found a
        date column, a revenue metric, and region + product dimensions. I'll
        suggest a <strong>Sales Performance</strong> dashboard — you can adjust
        column roles below before continuing.
      </p>
    </div>
  )
}

function ColumnTable({
  columns,
  onRoleChange,
}: {
  columns: DetectedColumn[]
  onRoleChange: (name: string, role: ColumnRole) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(23,58,64,0.1)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(23,58,64,0.08)] bg-[rgba(23,58,64,0.02)]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
                Column
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
                Type
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft) sm:table-cell">
                Sample values
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
                Assigned role
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft) md:table-cell">
                Nullable
              </th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => (
              <tr
                key={col.name}
                className={[
                  'border-b border-[rgba(23,58,64,0.05)] transition-colors hover:bg-[rgba(23,58,64,0.02)]',
                  i === columns.length - 1 ? 'border-b-0' : '',
                  col.role === 'ignore' ? 'opacity-50' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3">
                  <code className="rounded bg-[rgba(23,58,64,0.06)] px-1.5 py-0.5 font-mono text-xs text-(--sea-ink)">
                    {col.name}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <TypePill type={col.type} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="font-mono text-xs text-(--sea-ink-soft)">
                    {col.samples.join(' · ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    role={col.role}
                    onChange={(r) => onRoleChange(col.name, r)}
                  />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span
                    className={`text-xs ${col.nullable ? 'text-amber-600' : 'text-(--sea-ink-soft) opacity-50'}`}
                  >
                    {col.nullable ? 'Yes' : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProcessPage() {
  const navigate = useNavigate()
  const { file, file_id } = Route.useSearch()

  const [columns, setColumns] = useState<DetectedColumn[]>(INITIAL_COLUMNS)
  const [fileInfo, setFileInfo] = useState<{ rows: number; cols: number } | null>(null)
  const [analysisReady, setAnalysisReady] = useState(false)

  // Fetch real columns when a file_id is available
  useEffect(() => {
    if (!file_id) return
    api.process(file_id).then((res) => {
      setColumns(assignDefaultRoles(res.columns))
      setFileInfo({ rows: res.row_count, cols: res.column_count })
    })
  }, [file_id])

  const handleComplete = useCallback(() => {
    setAnalysisReady(true)
  }, [])
  const { progress, steps, showColumns } = useProgressSimulation(handleComplete)

  const handleRoleChange = (name: string, role: ColumnRole) => {
    setColumns((prev) =>
      prev.map((c) => (c.name === name ? { ...c, role } : c)),
    )
  }

  const activeCount = columns.filter((c) => c.role !== 'ignore').length
  const metricCount = columns.filter(
    (c) => c.role === 'primary_metric' || c.role === 'metric',
  ).length
  const dimCount = columns.filter((c) => c.role === 'dimension').length

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_66%)]" />

        <p className="island-kicker mb-3">Step 2 of 4</p>
        <h1 className="display-title mb-3 text-3xl font-bold leading-tight tracking-tight text-(--sea-ink) sm:text-4xl">
          Analyzing your file
        </h1>
        <p className="max-w-xl text-sm text-(--sea-ink-soft) sm:text-base">
          Dash is reading your columns, inferring types and roles, and preparing
          your dashboard. Review and adjust below before continuing.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-5">
          <div
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '60ms' }}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.08)] text-xl">
                📊
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-(--sea-ink)">
                  {file}
                </p>
                <p className="text-xs text-(--sea-ink-soft)">
                  {fileInfo
                    ? `${fileInfo.rows.toLocaleString()} rows · ${fileInfo.cols} columns`
                    : 'Analyzing…'}
                </p>
              </div>
              {analysisReady && (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Ready
                </span>
              )}
            </div>

            <div className="mb-1 flex justify-between text-xs text-(--sea-ink-soft)">
              <span>{analysisReady ? 'Analysis complete' : 'Analyzing…'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(23,58,64,0.08)]">
              <div
                className="h-full rounded-full bg-(--lagoon-deep) transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              {steps.map((step) => (
                <StepIndicator key={step.id} step={step} />
              ))}
            </div>
          </div>

          {showColumns && (
            <div
              className="flex flex-col gap-4 rise-in"
              style={{ animationDelay: '0ms' }}
            >
              <AIInsightBox />

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-(--sea-ink)">
                    Detected columns
                    <span className="ml-2 font-mono text-xs font-normal text-(--sea-ink-soft)">
                      ({activeCount} active · {metricCount} metrics · {dimCount}{' '}
                      dimensions)
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setColumns(INITIAL_COLUMNS)}
                    className="text-xs text-(--sea-ink-soft) underline-offset-2 hover:underline"
                  >
                    Reset to AI defaults
                  </button>
                </div>
                <ColumnTable
                  columns={columns}
                  onRoleChange={handleRoleChange}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: '80ms' }}
          >
            <p className="island-kicker mb-4">Column summary</p>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: 'Time axis',
                  value:
                    columns
                      .filter((c) => c.role === 'time_axis')
                      .map((c) => c.name)
                      .join(', ') || '—',
                  color: 'text-emerald-700',
                },
                {
                  label: 'Metrics',
                  value:
                    columns
                      .filter(
                        (c) =>
                          c.role === 'primary_metric' || c.role === 'metric',
                      )
                      .map((c) => c.name)
                      .join(', ') || '—',
                  color: 'text-blue-700',
                },
                {
                  label: 'Dimensions',
                  value:
                    columns
                      .filter((c) => c.role === 'dimension')
                      .map((c) => c.name)
                      .join(', ') || '—',
                  color: 'text-[var(--sea-ink)]',
                },
                {
                  label: 'Filters',
                  value:
                    columns
                      .filter((c) => c.role === 'filter')
                      .map((c) => c.name)
                      .join(', ') || '—',
                  color: 'text-amber-700',
                },
                {
                  label: 'Ignored',
                  value:
                    columns
                      .filter((c) => c.role === 'ignore')
                      .map((c) => c.name)
                      .join(', ') || '—',
                  color: 'text-[var(--sea-ink-soft)] opacity-60',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 odd:bg-[rgba(23,58,64,0.03)]"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-(--sea-ink-soft)">
                    {label}
                  </span>
                  <span
                    className={`font-mono text-xs leading-relaxed ${color}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {analysisReady && (
            <section
              className="island-shell rise-in rounded-2xl p-5"
              style={{ animationDelay: '0ms' }}
            >
              <p className="island-kicker mb-3">Suggested dashboard</p>
              <div className="rounded-xl border border-[rgba(37,99,235,0.25)] bg-[rgba(37,99,235,0.05)] px-4 py-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-(--sea-ink)">
                    Sales Performance
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-(--sea-ink-soft) leading-relaxed">
                  Revenue over time, by region and rep. Includes anomaly
                  detection on monthly dips.
                </p>
              </div>
              <p className="mt-3 text-xs text-(--sea-ink-soft)">
                You can change this on the next screen.
              </p>
            </section>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!analysisReady}
              onClick={() => navigate({ to: '/configure', search: { file, file_id } })}
              className={[
                'w-full rounded-2xl py-3.5 text-sm font-semibold transition',
                analysisReady
                  ? 'bg-(--lagoon-deep) text-white hover:opacity-90 hover:-translate-y-0.5'
                  : 'cursor-not-allowed bg-[rgba(23,58,64,0.07)] text-(--sea-ink-soft)',
              ].join(' ')}
            >
              {analysisReady ? 'Confirm & configure dashboard →' : 'Analyzing…'}
            </button>
            <Link
              to="/upload"
              className="block w-full rounded-2xl border border-[rgba(23,58,64,0.15)] py-3 text-center text-sm font-medium text-(--sea-ink-soft) no-underline transition hover:bg-[rgba(23,58,64,0.04)]"
            >
              ← Upload a different file
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
