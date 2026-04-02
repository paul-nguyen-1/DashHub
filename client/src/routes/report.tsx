import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { api, type ChatMessage, type DashboardData, type ReportSection } from '@/lib/api'
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

export const Route = createFileRoute('/report')({
  validateSearch: (s: Record<string, unknown>) => ({
    file_id: s.file_id ? String(s.file_id) : undefined,
    file: s.file ? String(s.file) : undefined,
    mode: s.mode === 'investigate' ? 'investigate' : 'report',
  }),
  component: ReportPage,
})

interface Message {
  role: 'user' | 'ai'
  content: string
}

function ChartTooltip({
  active,
  payload,
  label,
  prefix = '',
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  prefix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[rgba(23,58,64,0.1)] bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-0.5 font-semibold text-(--sea-ink)">{label}</p>
      <p className="text-(--sea-ink-soft)">
        {prefix}{payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-[rgba(23,58,64,0.08)] pb-2 text-xs font-bold uppercase tracking-widest text-(--sea-ink-soft)">
      {children}
    </h2>
  )
}

function AiChatPanel({ fileId }: { fileId?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'I generated this report from your CSV. Ask me anything about the findings.' },
  ])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const QUICK = [
    'Why did revenue drop?',
    'Which region performed best?',
    'What are the top recommendations?',
    'Summarize key findings',
  ]

  const handleSend = async (text = input.trim()) => {
    if (!text) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setThinking(true)
    try {
      if (fileId) {
        const nextHistory = [...history, userMsg]
        const { reply } = await api.chat(fileId, nextHistory)
        const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
        setHistory([...nextHistory, assistantMsg])
        setMessages((prev) => [...prev, { role: 'ai', content: reply }])
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: 'No file loaded — upload a CSV to get AI answers.' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Something went wrong. Please try again.' }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="flex w-60 shrink-0 flex-col border-l border-[rgba(23,58,64,0.1)] bg-white/80">
      <div className="flex items-center gap-2 border-b border-[rgba(23,58,64,0.08)] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold text-(--sea-ink)">Dash AI</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={[
              'rounded-xl px-3 py-2.5 text-xs leading-relaxed',
              msg.role === 'ai' ? 'bg-[rgba(23,58,64,0.04)] text-(--sea-ink)' : 'ml-2 bg-blue-50 text-blue-900',
            ].join(' ')}
          >
            {msg.content}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-1 px-1 py-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-(--sea-ink-soft) opacity-60"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}
        {messages.length <= 2 && (
          <div className="flex flex-col gap-1.5 pt-1">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => handleSend(q)}
                className="rounded-xl border border-[rgba(23,58,64,0.12)] bg-white px-3 py-2 text-left text-xs text-(--sea-ink-soft) transition hover:border-[rgba(37,99,235,0.3)] hover:text-(--lagoon-deep)">
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-[rgba(23,58,64,0.08)] p-2.5">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about this report…"
          className="min-w-0 flex-1 rounded-xl border border-[rgba(23,58,64,0.14)] bg-[rgba(23,58,64,0.03)] px-3 py-2 text-xs text-(--sea-ink) placeholder:text-(--sea-ink-soft) focus:outline-none focus:ring-1 focus:ring-(--lagoon-deep)" />
        <button type="button" onClick={() => handleSend()} disabled={!input.trim() || thinking}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-(--lagoon-deep) text-white transition hover:opacity-90 disabled:opacity-40">
          ↑
        </button>
      </div>
    </div>
  )
}

function ReportCharts({ data }: { data: DashboardData }) {
  const numCols = data.columns.numeric
  const dimCols = data.columns.dimensions
  const primaryCol = numCols[0]
  const secondaryCol = numCols[1]
  const dim0 = dimCols[0]

  const anomalyMonth = primaryCol && data.time_series.length
    ? [...data.time_series].sort((a, b) => (a[primaryCol] as number) - (b[primaryCol] as number))[0].month as string
    : ''

  return (
    <div className="flex flex-col gap-5">
      {primaryCol && data.time_series.length > 0 && (
        <section className="island-shell rounded-2xl p-5">
          <SectionHeading>{primaryCol.replace(/_/g, ' ')} by month</SectionHeading>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.time_series} barSize={40} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(23,58,64,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(23,58,64,0.04)' }} />
              <Bar dataKey={primaryCol} radius={[5, 5, 0, 0]}>
                {data.time_series.map((entry) => (
                  <Cell key={String(entry.month)}
                    fill={entry.month === anomalyMonth ? '#fca5a5' : '#2a8f97'}
                    stroke={entry.month === anomalyMonth ? '#f87171' : 'none'}
                    strokeWidth={entry.month === anomalyMonth ? 1 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {dim0 && primaryCol && (data.breakdowns[dim0]?.length ?? 0) > 0 && (
        <section className="island-shell rounded-2xl p-5">
          <SectionHeading>{primaryCol.replace(/_/g, ' ')} by {dim0.replace(/_/g, ' ')}</SectionHeading>
          <div className="flex flex-col gap-2.5 pt-1">
            {data.breakdowns[dim0].map((row) => {
              const label = String(row[dim0])
              const val = row[primaryCol] as number
              const max = (data.breakdowns[dim0][0][primaryCol] as number) || 1
              const pct = Math.round((val / max) * 100)
              return (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="w-20 shrink-0 truncate text-xs text-(--sea-ink-soft)">{label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-[rgba(23,58,64,0.07)]" style={{ height: 8 }}>
                    <div className="h-full rounded-full bg-(--lagoon-deep) transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs text-(--sea-ink-soft)">
                    {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {secondaryCol && data.time_series.length > 0 && (
        <section className="island-shell rounded-2xl p-5">
          <SectionHeading>{secondaryCol.replace(/_/g, ' ')} trend</SectionHeading>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.time_series} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(23,58,64,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8a9a98' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey={secondaryCol} stroke="#2a8f97" strokeWidth={2}
                dot={{ r: 3, fill: '#2a8f97', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  )
}

function ReportPage() {
  const { file_id, file, mode } = Route.useSearch()
  const isInvestigate = mode === 'investigate'
  const [exported, setExported] = useState(false)
  const [reportSections, setReportSections] = useState<ReportSection[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [dashData, setDashData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (!file_id) return
    setReportLoading(true)
    const fetch = isInvestigate ? api.investigateAnomalies(file_id) : api.generateReport(file_id)
    fetch
      .then(({ sections }) => setReportSections(sections))
      .finally(() => setReportLoading(false))
    api.getDashboard(file_id).then(setDashData).catch(console.error)
  }, [file_id, isInvestigate])

  const handleExport = () => {
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-(--page-bg,#f2f4f0)">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(23,58,64,0.1)] bg-white px-5">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="font-bold tracking-tight text-(--sea-ink) no-underline">
            Dash<span className="text-(--lagoon-deep)">Hub</span>
          </Link>
          <span className="text-[rgba(23,58,64,0.3)]">/</span>
          <Link to="/dashboard" className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)" search={{ file, file_id, dashboard_type: undefined }}>
            Dashboard
          </Link>
          <span className="text-[rgba(23,58,64,0.3)]">/</span>
          <span className="font-medium text-(--sea-ink)">{isInvestigate ? 'Investigate' : 'AI Report'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button"
            className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--sea-ink) transition hover:bg-[rgba(23,58,64,0.04)]">
            Share
          </button>
          <button type="button" onClick={handleExport}
            className={['rounded-xl px-3 py-1.5 text-xs font-semibold transition',
              exported ? 'bg-emerald-500 text-white' : 'bg-(--lagoon-deep) text-white hover:opacity-90'].join(' ')}>
            {exported ? '✓ Exported' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[rgba(23,58,64,0.12)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  {file ?? 'Uploaded file'}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Dash AI
                </span>
                <span className="rounded-full border border-[rgba(23,58,64,0.12)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-(--sea-ink) sm:text-3xl">
                {isInvestigate ? 'Anomaly Investigation' : 'AI Analysis Report'}
              </h1>
              <p className="mt-1 text-sm text-(--sea-ink-soft)">
                {isInvestigate
                  ? 'Anomaly detection and root cause analysis by Dash AI'
                  : 'Generated by Dash AI from your uploaded data'}
              </p>
            </div>

            {reportLoading ? (
              <section className="island-shell mb-5 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-sm text-(--sea-ink-soft)">
                  <span className="animate-pulse">✦</span> Generating report…
                </div>
              </section>
            ) : reportSections.length > 0 ? (
              <div className="mb-5 flex flex-col gap-4">
                {reportSections.map((section, i) => (
                  <section key={i} className="island-shell rounded-2xl p-5">
                    <SectionHeading>{section.title}</SectionHeading>
                    {section.type === 'paragraph' && section.content && (
                      <p className="text-sm leading-relaxed text-(--sea-ink)">{section.content}</p>
                    )}
                    {section.type === 'bullets' && section.items && (
                      <ul className="flex flex-col gap-2">
                        {section.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-(--sea-ink)">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--lagoon-deep)" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <section className="island-shell mb-5 rounded-2xl p-6">
                <p className="text-sm text-(--sea-ink-soft)">Upload a CSV to generate an AI report.</p>
              </section>
            )}

            {dashData && <ReportCharts data={dashData} />}

            <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(23,58,64,0.1)] bg-white/60 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(23,58,64,0.1)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  {file ?? 'Uploaded file'}
                </span>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Generated by Dash AI
                </span>
              </div>
              <div className="flex gap-2">
                <Link to="/upload"
                  className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--lagoon-deep) no-underline transition hover:bg-[rgba(23,58,64,0.04)]">
                  Upload new file →
                </Link>
                <Link to="/dashboard" search={{ file: undefined, file_id: undefined, dashboard_type: undefined }}
                  className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--sea-ink-soft) no-underline transition hover:bg-[rgba(23,58,64,0.04)]">
                  ← Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <AiChatPanel fileId={file_id} />
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
