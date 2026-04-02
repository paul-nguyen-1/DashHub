import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { api, type DashboardData, type InsightCard } from '@/lib/api'
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
    dashboard_type: s.dashboard_type ? String(s.dashboard_type) : undefined,
  }),
  component: DashboardPage,
})

interface Message {
  role: 'user' | 'ai'
  content: string
}



const FALLBACK_QUICK_QUESTIONS = [
  'What are the key trends?',
  'Which segment performed best?',
  'Any anomalies in the data?',
  'What do you recommend?',
]


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
  fileId,
  insights,
  quickQuestions,
  onDismissInsight,
  onInsightAction,
}: {
  fileId?: string
  insights: InsightCard[]
  quickQuestions: string[]
  onDismissInsight: (id: string) => void
  onInsightAction: (card: InsightCard) => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: '✦ Your dashboard is ready. Ask me anything about your data.',
    },
  ])
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = async (text = input.trim()) => {
    if (!text) return
    const userMsg = { role: 'user' as const, content: text }
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setThinking(true)

    try {
      if (fileId) {
        const nextHistory = [...history, userMsg]
        const { reply } = await api.chat(fileId, nextHistory)
        setHistory([...nextHistory, { role: 'assistant', content: reply }])
        setMessages((prev) => [...prev, { role: 'ai', content: reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: 'No file loaded — upload a CSV to ask questions.' },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handleQuickQuestion = (q: string) => handleSend(q)

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
              {quickQuestions.map((q) => (
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
          onClick={() => handleSend()}
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
  const [insights, setInsights] = useState<InsightCard[]>([])
  const [quickQuestions, setQuickQuestions] = useState<string[]>(FALLBACK_QUICK_QUESTIONS)
  const [showBanner, setShowBanner] = useState(!!file_id)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (!file_id) return
    api.getDashboard(file_id).then(setData).catch(console.error)
    api.getInsights(file_id)
      .then(({ insights, quick_questions }) => {
        setInsights(insights)
        setQuickQuestions(quick_questions)
      })
      .catch(console.error)
  }, [file_id])

  const reportSearch = { file, file_id }

  const numCols = data?.columns.numeric ?? []
  const dimCols = data?.columns.dimensions ?? []
  const primaryCol = numCols[0]
  const secondaryCol = numCols[1]
  const tertiaryCol = numCols[numCols.length - 1]
  const dim0 = dimCols[0]
  const dim1 = dimCols[1]

  const anomalyMonth = primaryCol && data?.time_series.length
    ? [...data.time_series].sort(
        (a, b) => (a[primaryCol] as number) - (b[primaryCol] as number),
      )[0].month as string
    : ''

  const dismissInsight = (id: string) =>
    setInsights((prev) => prev.filter((c) => c.id !== id))

  const handleInsightAction = (card: InsightCard) => {
    if (card.id === 'anomaly-sep') {
      window.location.href = `/report?file=${file ?? ''}&file_id=${file_id ?? ''}&mode=investigate`
    }
  }

  const dim0Values = dim0
    ? ['All', ...(data?.breakdowns[dim0] ?? []).map((r) => String(r[dim0]))]
    : ['All']
  const [dimFilter, setDimFilter] = useState('All')

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
          {dim0 && dim0Values.length > 1 && (
            <select
              value={dimFilter}
              onChange={(e) => setDimFilter(e.target.value)}
              className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs text-(--sea-ink) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)"
            >
              {dim0Values.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}

          <Link
            to="/report"
            search={{ ...reportSearch, mode: 'report' }}
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
          {showBanner && anomalyMonth && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                ⚠ {anomalyMonth} shows the lowest {primaryCol ?? 'metric'} — possible anomaly detected
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/report"
                  search={{ ...reportSearch, mode: 'investigate' }}
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
            {numCols.slice(0, 4).map((col, i) => {
              const stat = data?.kpis[col]
              const value = stat
                ? i === 0
                  ? fmt(stat.sum)
                  : stat.sum % 1 === 0
                    ? stat.sum.toLocaleString()
                    : `$${stat.mean.toFixed(2)}`
                : '—'
              return (
                <KpiCard
                  key={col}
                  label={col.replace(/_/g, ' ')}
                  value={value}
                  delta=""
                  up={null}
                />
              )
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
            {primaryCol && (
              <div className="island-shell rounded-2xl p-4">
                <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                  {primaryCol.replace(/_/g, ' ')} by month
                  {anomalyMonth && (
                    <span className="ml-2 font-normal opacity-60">
                      — {anomalyMonth} anomaly highlighted
                    </span>
                  )}
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={data?.time_series ?? []}
                    barSize={22}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="rgba(23,58,64,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(23,58,64,0.04)' }} />
                    <Bar dataKey={primaryCol} radius={[4, 4, 0, 0]}>
                      {(data?.time_series ?? []).map((entry) => (
                        <Cell
                          key={String(entry.month)}
                          fill={entry.month === anomalyMonth ? '#fca5a5' : '#2a8f97'}
                          stroke={entry.month === anomalyMonth ? '#f87171' : 'none'}
                          strokeWidth={entry.month === anomalyMonth ? 1 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {dim0 && (
              <div className="island-shell rounded-2xl p-4">
                <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                  {primaryCol?.replace(/_/g, ' ')} by {dim0.replace(/_/g, ' ')}
                </p>
                <div className="flex flex-col gap-2.5 pt-1">
                  {(data?.breakdowns[dim0] ?? []).map((row) => {
                    const label = String(row[dim0])
                    const val = row[primaryCol] as number
                    const max = (data?.breakdowns[dim0]?.[0]?.[primaryCol] as number) ?? 1
                    const pct = Math.round((val / max) * 100)
                    return (
                      <div key={label} className="flex items-center gap-2.5">
                        <span className="w-14 shrink-0 truncate text-xs text-(--sea-ink-soft)">{label}</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-[rgba(23,58,64,0.07)]" style={{ height: 8 }}>
                          <div className="h-full rounded-full bg-(--lagoon-deep) transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs text-(--sea-ink-soft)">{fmt(val)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {dim1 && primaryCol && (
              <div className="island-shell rounded-2xl p-4">
                <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                  Top {dim1.replace(/_/g, ' ')}
                </p>
                <div className="flex flex-col gap-2.5">
                  {(data?.breakdowns[dim1] ?? []).map((row) => {
                    const label = String(row[dim1])
                    const val = row[primaryCol] as number
                    const max = (data?.breakdowns[dim1]?.[0]?.[primaryCol] as number) ?? 1
                    const pct = Math.round((val / max) * 100)
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 truncate text-xs text-(--sea-ink-soft)">{label}</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-[rgba(23,58,64,0.07)]" style={{ height: 7 }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#2a8f97' }} />
                        </div>
                        <span className="w-12 shrink-0 text-right text-xs text-(--sea-ink-soft)">{fmt(val)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {tertiaryCol && tertiaryCol !== primaryCol && (
              <div className="island-shell rounded-2xl p-4">
                <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                  Avg {tertiaryCol.replace(/_/g, ' ')} trend
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={data?.time_series ?? []} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(23,58,64,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip prefix="" />} />
                    <Line type="monotone" dataKey={tertiaryCol} stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {secondaryCol && secondaryCol !== tertiaryCol && (
              <div className="island-shell rounded-2xl p-4">
                <p className="mb-3 text-xs font-semibold text-(--sea-ink-soft)">
                  {secondaryCol.replace(/_/g, ' ')} by month
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={data?.time_series ?? []} barSize={14} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(23,58,64,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip prefix="" />} />
                    <Bar dataKey={secondaryCol} radius={[3, 3, 0, 0]}>
                      {(data?.time_series ?? []).map((entry) => (
                        <Cell
                          key={String(entry.month)}
                          fill={entry.month === anomalyMonth ? '#fca5a5' : '#2a8f97'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-1 pb-1">
            <span className="text-xs text-(--sea-ink-soft) opacity-60">
              Source: {file ?? 'uploaded file'}
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
          fileId={file_id}
          insights={insights}
          quickQuestions={quickQuestions}
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
