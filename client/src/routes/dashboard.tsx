import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

export const Route = createFileRoute('/dashboard')({
  validateSearch: (s: Record<string, unknown>) => ({
    file: s.file ? String(s.file) : undefined,
    file_id: s.file_id ? String(s.file_id) : undefined,
  }),
  component: DashboardPage,
})

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface InsightCard {
  id: string
  type: 'anomaly' | 'insight' | 'suggestion'
  title: string
  body: string
  action?: string
}

const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 62400 },
  { month: 'Feb', revenue: 71200 },
  { month: 'Mar', revenue: 68900 },
  { month: 'Apr', revenue: 84100 },
  { month: 'May', revenue: 79600 },
  { month: 'Jun', revenue: 93800 },
  { month: 'Jul', revenue: 112400 },
  { month: 'Aug', revenue: 141200 },
  { month: 'Sep', revenue: 62900 },
]

const REGION_REVENUE = [
  { region: 'North', revenue: 412000 },
  { region: 'West', revenue: 328000 },
  { region: 'South', revenue: 261000 },
  { region: 'East', revenue: 192000 },
  { region: 'Central', revenue: 47000 },
]

const PRODUCT_REVENUE = [
  { product: 'Widget A', revenue: 380000 },
  { product: 'Widget B', revenue: 295000 },
  { product: 'Widget C', revenue: 190000 },
  { product: 'Widget D', revenue: 115000 },
]

const DEAL_SIZE_TREND = [
  { month: 'Jan', avg: 68.2 },
  { month: 'Feb', avg: 68.8 },
  { month: 'Mar', avg: 69.1 },
  { month: 'Apr', avg: 68.5 },
  { month: 'May', avg: 69.4 },
  { month: 'Jun', avg: 68.9 },
  { month: 'Jul', avg: 68.1 },
  { month: 'Aug', avg: 67.8 },
  { month: 'Sep', avg: 67.3 },
]

const UNITS_BY_MONTH = [
  { month: 'Jan', units: 916 },
  { month: 'Feb', units: 1048 },
  { month: 'Mar', units: 1012 },
  { month: 'Apr', units: 1238 },
  { month: 'May', units: 1170 },
  { month: 'Jun', units: 1380 },
  { month: 'Jul', units: 1654 },
  { month: 'Aug', units: 2078 },
  { month: 'Sep', units: 932 },
]

const INITIAL_INSIGHTS: InsightCard[] = [
  {
    id: 'anomaly-sep',
    type: 'anomaly',
    title: 'September revenue collapsed',
    body: 'North region revenue dropped 46% vs August. 3 reps logged zero sales after Sep 15.',
    action: 'Generate report',
  },
  {
    id: 'insight-west',
    type: 'insight',
    title: 'West region growing fast',
    body: 'West grew 18% QoQ — your fastest expanding market this quarter.',
    action: 'Explore',
  },
  {
    id: 'suggestion-leaderboard',
    type: 'suggestion',
    title: 'Add a rep leaderboard?',
    body: 'I see 24 unique values in rep_name. A leaderboard chart would surface your top performers.',
    action: 'Add chart',
  },
]

const QUICK_QUESTIONS = [
  'Why did Sep drop?',
  'Top rep by revenue',
  'Forecast Q4',
  'Compare regions',
]

const ANOMALY_MONTH = 'Sep'

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtShort(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function ChartTooltip({
  active,
  payload,
  label,
  prefix = '$',
  suffix = '',
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  prefix?: string
  suffix?: string
}) {
  if (!active || !payload?.length) {
    return null
  }
  return (
    <div className="rounded-xl border border-[rgba(23,58,64,0.12)] bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-0.5 font-semibold text-(--sea-ink)">{label}</p>
      <p className="text-(--sea-ink-soft)">
        {prefix}
        {payload[0].value.toLocaleString()}
        {suffix}
      </p>
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  up,
}: {
  label: string
  value: string
  delta: string
  up: boolean | null
}) {
  return (
    <div className="island-shell rounded-2xl px-4 py-4">
      <p className="mb-1.5 text-xs font-medium text-(--sea-ink-soft)">
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight text-(--sea-ink)">
        {value}
      </p>
      {delta && (
        <p
          className={[
            'mt-1 text-xs font-medium',
            up === true
              ? 'text-emerald-600'
              : up === false
                ? 'text-red-500'
                : 'text-(--sea-ink-soft)',
          ].join(' ')}
        >
          {delta}
        </p>
      )}
    </div>
  )
}

function InsightCardView({
  card,
  onAction,
  onDismiss,
}: {
  card: InsightCard
  onAction: (card: InsightCard) => void
  onDismiss: (id: string) => void
}) {
  const borderColor =
    card.type === 'anomaly'
      ? 'border-l-red-400'
      : card.type === 'insight'
        ? 'border-l-emerald-400'
        : 'border-l-blue-400'

  const tagColor =
    card.type === 'anomaly'
      ? 'text-red-600'
      : card.type === 'insight'
        ? 'text-emerald-700'
        : 'text-blue-700'

  return (
    <div
      className={`rounded-r-xl border border-l-[3px] border-[rgba(23,58,64,0.1)] bg-white p-3 ${borderColor}`}
    >
      <div className="mb-1 flex items-start justify-between gap-1">
        <span
          className={`text-xs font-bold uppercase tracking-wide ${tagColor}`}
        >
          {card.type}
        </span>
        <button
          type="button"
          onClick={() => onDismiss(card.id)}
          className="text-xs text-(--sea-ink-soft) opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>
      <p className="mb-1 text-xs font-semibold text-(--sea-ink)">
        {card.title}
      </p>
      <p className="text-xs leading-relaxed text-(--sea-ink-soft)">
        {card.body}
      </p>
      {card.action && (
        <button
          type="button"
          onClick={() => onAction(card)}
          className="mt-2 rounded-lg border border-[rgba(23,58,64,0.14)] bg-white px-2.5 py-1 text-xs font-medium text-(--sea-ink) transition hover:bg-[rgba(23,58,64,0.04)]"
        >
          {card.action} →
        </button>
      )}
    </div>
  )
}

function AiPanel({
  insights,
  onDismissInsight,
  onInsightAction,
}: {
  insights: InsightCard[]
  onDismissInsight: (id: string) => void
  onInsightAction: (card: InsightCard) => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        "✦ I analyzed **2,418 rows** and built this dashboard. Here's what stood out:",
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const AI_RESPONSES: Record<string, string> = {
    'why did sep drop?':
      'North region drove ~91% of the drop. J. Smith, R. Patel, and M. Lee logged zero sales after Sep 15 — all three were active all of July and August. Most likely a data entry gap or personnel change.',
    'top rep by revenue':
      'Based on your data, J. Smith (North) led Q3 with the highest revenue per entry in Jul–Aug. R. Patel (West) was close behind and showed consistent growth. Both are significantly above the team average.',
    'forecast q4':
      "Based on the Jul–Aug trajectory (+26% MoM), Q4 could hit ~$1.6M if North recovers. Without North, West and South trends suggest ~$1.1M. I'd recommend resolving the North gap before forecasting.",
    'compare regions':
      'West is your fastest grower (+18% QoQ). North has the highest absolute revenue but the Sep anomaly brought it down sharply. South is steady. Central and East are underweighted — both have room to scale.',
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setThinking(true)
    await new Promise((r) => setTimeout(r, 900))
    setThinking(false)
    const key = text.toLowerCase()
    const answer =
      AI_RESPONSES[key] ??
      `Good question about "${text}". Based on your CSV data, I'd look at the regional breakdown and the Sep 15 cutoff as the most relevant signal. Want me to generate a focused report on this?`
    setMessages((prev) => [...prev, { role: 'ai', content: answer }])
  }

  const handleQuickQuestion = (q: string) => {
    setInput(q)
  }

  return (
    <div className="flex w-64 shrink-0 flex-col border-l border-[rgba(23,58,64,0.1)] bg-white/80">
      <div className="flex items-center gap-2 border-b border-[rgba(23,58,64,0.08)] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold text-(--sea-ink)">Dash AI</span>
        <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
          Live
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={[
              'rounded-xl px-3 py-2.5 text-xs leading-relaxed',
              msg.role === 'ai'
                ? 'bg-[rgba(23,58,64,0.04)] text-(--sea-ink)'
                : 'ml-3 bg-blue-50 text-blue-900',
            ].join(' ')}
          >
            {msg.content}
          </div>
        ))}

        {thinking && (
          <div className="flex gap-1 px-1 py-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-(--sea-ink-soft) opacity-60"
                style={{
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="flex flex-col gap-2 pt-1">
            {insights.map((card) => (
              <InsightCardView
                key={card.id}
                card={card}
                onAction={onInsightAction}
                onDismiss={onDismissInsight}
              />
            ))}
          </div>
        )}

        {messages.length <= 2 && (
          <div className="pt-1">
            <p className="mb-1.5 text-xs text-(--sea-ink-soft)">
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickQuestion(q)}
                  className="rounded-full border border-[rgba(23,58,64,0.14)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft) transition hover:border-[rgba(37,99,235,0.3)] hover:text-(--lagoon-deep)"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-[rgba(23,58,64,0.08)] p-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your data…"
          className="min-w-0 flex-1 rounded-xl border border-[rgba(23,58,64,0.14)] bg-[rgba(23,58,64,0.03)] px-3 py-2 text-xs text-(--sea-ink) placeholder:text-(--sea-ink-soft) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--lagoon-deep) text-white transition hover:opacity-90 disabled:opacity-40"
        >
          ↑
        </button>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { file, file_id } = Route.useSearch()
  const [insights, setInsights] = useState<InsightCard[]>(INITIAL_INSIGHTS)
  const [regionFilter, setRegionFilter] = useState('All regions')
  const [dateFilter, setDateFilter] = useState('Jul–Sep 2025')
  const [showBanner, setShowBanner] = useState(true)

  const reportSearch = { file, file_id }

  const dismissInsight = (id: string) =>
    setInsights((prev) => prev.filter((c) => c.id !== id))

  const handleInsightAction = (card: InsightCard) => {
    if (card.id === 'anomaly-sep') {
      window.location.href = `/report?file=${file ?? ''}&file_id=${file_id ?? ''}`
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-(--page-bg,#f2f4f0)">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(23,58,64,0.1)] bg-white px-5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-base font-bold tracking-tight text-(--sea-ink) no-underline"
          >
            Dash<span className="text-(--lagoon-deep)">Hub</span>
          </Link>
          <span className="hidden text-[rgba(23,58,64,0.3)] sm:inline">/</span>
          <span className="hidden text-sm font-medium text-(--sea-ink)nline">
            Sales Performance
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs text-(--sea-ink) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
          >
            {[
              'Jul–Sep 2025',
              'Jul 2025',
              'Aug 2025',
              'Sep 2025',
              'All data',
            ].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs text-(--sea-ink) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
          >
            {['All regions', 'North', 'West', 'South', 'East', 'Central'].map(
              (o) => (
                <option key={o}>{o}</option>
              ),
            )}
          </select>

          <Link
            to="/report"
            search={reportSearch}
            className="rounded-xl bg-(--lagoon-deep) px-3 py-1.5 text-xs font-semibold text-white! no-underline transition hover:opacity-90"
          >
            Generate report →
          </Link>

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            PK
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-3">
          {showBanner && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                ⚠ September revenue dropped 46% vs August — North region
                accounts for 80% of the shortfall
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/report"
            search={reportSearch}
                  className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white no-underline transition hover:bg-red-700"
                >
                  Investigate →
                </Link>
                <button
                  type="button"
                  onClick={() => setShowBanner(false)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Total revenue"
              value="$1.24M"
              delta="↑ 9.2% vs Q2"
              up={true}
            />
            <KpiCard
              label="Units sold"
              value="18,430"
              delta="↑ 6.7%"
              up={true}
            />
            <KpiCard
              label="Avg deal size"
              value="$67.30"
              delta="↓ 2.4%"
              up={false}
            />
            <KpiCard
              label="Active reps"
              value="24"
              delta="No change"
              up={null}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
            <div className="island-shell rounded-2xl p-4">
              <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                Monthly revenue
                <span className="ml-2 font-normal opacity-60">
                  — Sep anomaly highlighted
                </span>
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={MONTHLY_REVENUE}
                  barSize={22}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(23,58,64,0.06)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(23,58,64,0.04)' }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {MONTHLY_REVENUE.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={
                          entry.month === ANOMALY_MONTH ? '#fca5a5' : '#2a8f97'
                        }
                        stroke={
                          entry.month === ANOMALY_MONTH ? '#f87171' : 'none'
                        }
                        strokeWidth={entry.month === ANOMALY_MONTH ? 1 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="island-shell rounded-2xl p-4">
              <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                Revenue by region
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                {REGION_REVENUE.map(({ region, revenue }) => {
                  const pct = Math.round(
                    (revenue / REGION_REVENUE[0].revenue) * 100,
                  )
                  return (
                    <div key={region} className="flex items-center gap-2.5">
                      <span className="w-14 shrink-0 text-xs text-(--sea-ink-soft)">
                        {region}
                      </span>
                      <div
                        className="flex-1 overflow-hidden rounded-full bg-[rgba(23,58,64,0.07)]"
                        style={{ height: 8 }}
                      >
                        <div
                          className="h-full rounded-full bg-(--lagoon-deep) transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            opacity:
                              region === 'North' ? 1 : 0.55 + pct * 0.004,
                          }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs text-(--sea-ink-soft)">
                        {fmt(revenue)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="island-shell rounded-2xl p-4">
              <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                Top products
              </p>
              <div className="flex flex-col gap-2.5">
                {PRODUCT_REVENUE.map(({ product, revenue }) => {
                  const pct = Math.round(
                    (revenue / PRODUCT_REVENUE[0].revenue) * 100,
                  )
                  return (
                    <div key={product} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-(--sea-ink-soft)">
                        {product}
                      </span>
                      <div
                        className="flex-1 overflow-hidden rounded-full bg-[rgba(23,58,64,0.07)]"
                        style={{ height: 7 }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: '#2a8f97' }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs text-(--sea-ink-soft)">
                        {fmt(revenue)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="island-shell rounded-2xl p-4">
              <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                Avg deal size
                <span className="ml-2 font-normal text-red-500">
                  ↓ trending down
                </span>
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart
                  data={DEAL_SIZE_TREND}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(23,58,64,0.06)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[66, 70]}
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip prefix="$" />} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="island-shell rounded-2xl p-4">
              <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                Units sold by month
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart
                  data={UNITS_BY_MONTH}
                  barSize={14}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(23,58,64,0.06)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={fmtShort}
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Bar dataKey="units" radius={[3, 3, 0, 0]}>
                    {UNITS_BY_MONTH.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={
                          entry.month === ANOMALY_MONTH ? '#fca5a5' : '#2a8f97'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 pb-1">
            <span className="text-xs text-(--sea-ink-soft) opacity-60">
              Source: Sales_Q3_2025.csv · 131 rows · Last imported just now
            </span>
            <Link
              to="/upload"
              className="text-xs text-(--lagoon-deep) no-underline opacity-70 hover:opacity-100 hover:underline"
            >
              Replace →
            </Link>
          </div>
        </div>

        <AiPanel
          insights={insights}
          onDismissInsight={dismissInsight}
          onInsightAction={handleInsightAction}
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
