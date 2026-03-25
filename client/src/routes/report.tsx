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
  ReferenceLine,
} from 'recharts'

export const Route = createFileRoute('/report')({ component: ReportPage })

interface Message {
  role: 'user' | 'ai'
  content: string
}

const ANOMALY_MONTHS = [
  { month: 'Jun', revenue: 93800 },
  { month: 'Jul', revenue: 112400 },
  { month: 'Aug', revenue: 141200 },
  { month: 'Sep', revenue: 62900 },
]

const NORTH_WEEKLY = [
  { week: 'Jul W1', revenue: 28400 },
  { week: 'Jul W2', revenue: 31200 },
  { week: 'Aug W1', revenue: 34800 },
  { week: 'Aug W2', revenue: 38600 },
  { week: 'Aug W3', revenue: 36200 },
  { week: 'Aug W4', revenue: 32800 },
  { week: 'Sep W1', revenue: 24600 },
  { week: 'Sep W2', revenue: 18200 },
  { week: 'Sep W3', revenue: 9800 },
  { week: 'Sep W4', revenue: 8600 },
]

const ZERO_REPS = [
  {
    rep: 'J. Smith',
    region: 'North',
    lastSale: 'Sep 14',
    status: 'Open',
    deals: 0,
  },
  {
    rep: 'R. Patel',
    region: 'North',
    lastSale: 'Sep 17',
    status: 'Open',
    deals: 0,
  },
  {
    rep: 'M. Lee',
    region: 'North',
    lastSale: 'Sep 18',
    status: 'Lost',
    deals: 0,
  },
]

const AI_RESPONSES: Record<string, string> = {
  'why did it drop?':
    'Three North reps logged zero sales after Sep 15 — J. Smith, R. Patel, and M. Lee. Their combined shortfall is ~$81K, which accounts for 91% of the September decline. This is too concentrated to be a market issue.',
  'is it a data issue?':
    "Possibly. The pattern is unusually clean — all three reps go dark on the same week in the same region. If deals were entered into a separate CRM system after Sep 15, those rows wouldn't appear in your CSV. I'd cross-reference before taking action.",
  'what should we do?':
    "1. Verify whether J. Smith, R. Patel, and M. Lee are still active — check your CRM or HR system. 2. If they're gone, redistribute the North region pipeline immediately. 3. Upload October's CSV as soon as it's available so I can confirm whether the dip is ongoing.",
  'how do i share this report?':
    'Click "Export PDF" in the top right to download a formatted version. You can also copy the report URL and share it directly — anyone with access to DashHub can view it.',
  'upload october data':
    "Go to the Upload page and drop October's CSV. I'll automatically merge it with the Q3 data and update this report and all your dashboard charts. The anomaly section will update based on whether the North region recovered.",
}

function ChartTooltip({
  active,
  payload,
  label,
  prefix = '$',
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
        {prefix}
        {payload[0].value.toLocaleString()}
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--lagoon-deep)" />
      <p className="text-sm leading-relaxed text-(--sea-ink)">{children}</p>
    </div>
  )
}

function RepZeroCard({ rep }: { rep: (typeof ZERO_REPS)[number] }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-(--sea-ink)">{rep.rep}</p>
        <p className="text-xs text-(--sea-ink-soft)">
          {rep.region} · Last sale: {rep.lastSale}
        </p>
      </div>
      <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600">
        0 sales after Sep 15
      </span>
    </div>
  )
}

function AiChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        'I generated this report from your CSV. Ask me anything about the findings.',
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const QUICK = [
    'Why did it drop?',
    'Is it a data issue?',
    'What should we do?',
    'Upload October data',
  ]

  const handleSend = async (text = input.trim()) => {
    if (!text) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setThinking(true)
    await new Promise((r) => setTimeout(r, 800))
    setThinking(false)
    const key = text.toLowerCase()
    const answer =
      AI_RESPONSES[key] ??
      `That's a good angle. Based on the CSV data, I'd focus on the Sep 15 cutoff and the North region concentration. Want me to add this to the report as an additional finding?`
    setMessages((prev) => [...prev, { role: 'ai', content: answer }])
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
              msg.role === 'ai'
                ? 'bg-[rgba(23,58,64,0.04)] text-(--sea-ink)'
                : 'ml-2 bg-blue-50 text-blue-900',
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

        {messages.length <= 2 && (
          <div className="flex flex-col gap-1.5 pt-1">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="rounded-xl border border-[rgba(23,58,64,0.12)] bg-white px-3 py-2 text-left text-xs text-(--sea-ink-soft) transition hover:border-[rgba(37,99,235,0.3)] hover:text-(--lagoon-deep)"
              >
                {q}
              </button>
            ))}
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
          placeholder="Ask about this report…"
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

function ReportPage() {
  const [exported, setExported] = useState(false)

  const handleExport = () => {
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-(--page-bg,#f2f4f0)">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[rgba(23,58,64,0.1)] bg-white px-5">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="font-bold tracking-tight text-(--sea-ink) no-underline"
          >
            Dash<span className="text-(--lagoon-deep)">Hub</span>
          </Link>
          <span className="text-[rgba(23,58,64,0.3)]">/</span>
          <Link
            to="/dashboard"
            className="text-(--sea-ink-soft) no-underline hover:text-(--sea-ink)"
          >
            Sales Performance
          </Link>
          <span className="text-[rgba(23,58,64,0.3)]">/</span>
          <span className="font-medium text-(--sea-ink)">AI Report</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--sea-ink) transition hover:bg-[rgba(23,58,64,0.04)]"
          >
            Schedule weekly
          </button>
          <button
            type="button"
            className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--sea-ink) transition hover:bg-[rgba(23,58,64,0.04)]"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleExport}
            className={[
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
              exported
                ? 'bg-emerald-500 text-white'
                : 'bg-(--lagoon-deep) text-white hover:opacity-90',
            ].join(' ')}
          >
            {exported ? '✓ Exported' : 'Export PDF'}
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            PK
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[rgba(23,58,64,0.12)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  Sales_Q3_2025.csv
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Dash AI
                </span>
                <span className="rounded-full border border-[rgba(23,58,64,0.12)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  Confidence 91%
                </span>
                <span className="rounded-full border border-[rgba(23,58,64,0.12)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  Sep 30, 2025
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-(--sea-ink) sm:text-3xl">
                Q3 Sales Performance Report
              </h1>
              <p className="mt-1 text-sm text-(--sea-ink-soft)">
                September anomaly · North region · Generated by Dash AI
              </p>
            </div>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>Executive summary</SectionHeading>
              <p className="text-sm leading-relaxed text-(--sea-ink)">
                Q3 revenue reached <strong>$1.24M</strong>, up 9.2% vs Q2,
                driven by strong July and August performance. However, September
                showed a <strong>46% revenue decline</strong> from August —
                dropping from $141K to $63K. This decline was driven almost
                entirely by the North region, where three sales reps logged zero
                activity after September 15. The shortfall of approximately{' '}
                <strong>$81K</strong> accounts for 91% of the month-over-month
                drop.
              </p>
            </section>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>
                September anomaly — monthly revenue
              </SectionHeading>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={ANOMALY_MONTHS}
                  barSize={48}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(23,58,64,0.06)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(23,58,64,0.04)' }}
                  />
                  <ReferenceLine
                    y={141200}
                    stroke="rgba(23,58,64,0.2)"
                    strokeDasharray="4 3"
                    label={{
                      value: 'Aug avg',
                      position: 'right',
                      fontSize: 10,
                      fill: '#8a9a98',
                    }}
                  />
                  <Bar dataKey="revenue" radius={[5, 5, 0, 0]}>
                    {ANOMALY_MONTHS.map((entry) => (
                      <Cell
                        key={entry.month}
                        fill={entry.month === 'Sep' ? '#fca5a5' : '#2a8f97'}
                        stroke={entry.month === 'Sep' ? '#f87171' : 'none'}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs text-(--sea-ink-soft)">
                September revenue ($62.9K) was 55% below the August figure
                ($141.2K) and below every month since March.
              </p>
            </section>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>
                North region — week-over-week decline
              </SectionHeading>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart
                  data={NORTH_WEEKLY}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(23,58,64,0.06)"
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 10, fill: '#8a9a98' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine
                    x="Sep W2"
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Sep 15 cutoff',
                      position: 'top',
                      fontSize: 10,
                      fill: '#ef4444',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs text-(--sea-ink-soft)">
                North region revenue declined steadily from Sep W2 onward,
                coinciding exactly with when J. Smith, R. Patel, and M. Lee
                stopped logging sales.
              </p>
            </section>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>Reps with zero sales after Sep 15</SectionHeading>
              <div className="flex flex-col gap-2.5">
                {ZERO_REPS.map((rep) => (
                  <RepZeroCard key={rep.rep} rep={rep} />
                ))}
              </div>
              <p className="mt-3 text-xs text-(--sea-ink-soft)">
                All three reps were active and performing throughout July and
                August. The abrupt stop on the same week in the same region is
                the primary signal for the anomaly.
              </p>
            </section>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>Key findings</SectionHeading>
              <div className="flex flex-col gap-3">
                <Bullet>
                  North region revenue dropped from <strong>$142K (Aug)</strong>{' '}
                  to <strong>$61K (Sep)</strong> — an $81K shortfall that
                  accounts for 91% of the month-over-month decline.
                </Bullet>
                <Bullet>
                  J. Smith, R. Patel, and M. Lee each logged{' '}
                  <strong>zero sales after Sep 15</strong>. All three were in
                  the top half of the team by revenue in August.
                </Bullet>
                <Bullet>
                  <strong>West region grew 18% QoQ</strong> and is now the
                  second-highest revenue region. This growth offset some of the
                  North shortfall at the total level.
                </Bullet>
                <Bullet>
                  Average deal size declined <strong>2.4% across Q3</strong>{' '}
                  ($67.30 vs $68.90 in Q2), suggesting mild pricing pressure or
                  a product mix shift toward lower-value SKUs.
                </Bullet>
                <Bullet>
                  Widget A remained the top product at <strong>$380K</strong>,
                  accounting for 31% of total Q3 revenue. No anomaly was
                  detected in product-level data.
                </Bullet>
              </div>
            </section>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>Likely root cause</SectionHeading>
              <p className="mb-3 text-sm leading-relaxed text-(--sea-ink)">
                The concentration of zero-activity across three reps in a single
                region after a specific date is{' '}
                <strong>
                  not consistent with a market-driven demand decline
                </strong>
                . Regional demand drops typically present as reduced deal sizes
                or longer sales cycles — not an abrupt full stop from multiple
                reps simultaneously.
              </p>
              <p className="text-sm leading-relaxed text-(--sea-ink)">
                The most likely explanations, in order of probability:
              </p>
              <ol className="mt-3 flex flex-col gap-2 pl-1">
                {[
                  'Personnel changes — one or more reps left, were reassigned, or went on leave after Sep 15.',
                  'Data entry gap — deals were logged in a separate CRM system not included in this CSV export.',
                  'Territory restructure — the North region was reorganized mid-quarter, causing a reporting gap.',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm leading-relaxed text-(--sea-ink)"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(37,99,235,0.1)] text-xs font-bold text-(--lagoon-deep)">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <section className="island-shell mb-5 rounded-2xl p-5">
              <SectionHeading>Recommendations</SectionHeading>
              <div className="flex flex-col gap-3">
                <Bullet>
                  <strong>Verify rep status immediately.</strong> Check whether
                  J. Smith, R. Patel, and M. Lee are still active in your CRM or
                  HR system. If any have departed, redistribute their open
                  pipeline to active reps.
                </Bullet>
                <Bullet>
                  <strong>Reassign North region coverage for Q4.</strong> Even
                  if the reps are still active, the North region is currently
                  underweighted. Assign a coverage owner before Q4 begins.
                </Bullet>
                <Bullet>
                  <strong>Increase West region investment.</strong> West is your
                  fastest-growing market at +18% QoQ with no anomalies detected.
                  Additional headcount or marketing spend here has the highest
                  expected return.
                </Bullet>
                <Bullet>
                  <strong>Upload October CSV to confirm recovery.</strong> Once
                  October closes, upload the CSV and Dash will automatically
                  update this report and flag whether North has recovered or the
                  decline is ongoing.
                </Bullet>
                <Bullet>
                  <strong>Review deal size trend.</strong> The 2.4% decline in
                  average deal size is not urgent but bears monitoring. Check
                  whether the mix shift toward Widget C and D is intentional or
                  a sign of pricing pressure from a competitor.
                </Bullet>
              </div>
            </section>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(23,58,64,0.1)] bg-white/60 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgba(23,58,64,0.1)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  Sales_Q3_2025.csv
                </span>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Generated by Dash AI
                </span>
                <span className="rounded-full border border-[rgba(23,58,64,0.1)] bg-white px-2.5 py-1 text-xs text-(--sea-ink-soft)">
                  Confidence 91%
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/upload"
                  className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--lagoon-deep) no-underline transition hover:bg-[rgba(23,58,64,0.04)]"
                >
                  Upload October data →
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-xl border border-[rgba(23,58,64,0.14)] bg-white px-3 py-1.5 text-xs font-medium text-(--sea-ink-soft) no-underline transition hover:bg-[rgba(23,58,64,0.04)]"
                >
                  ← Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <AiChatPanel />
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
