import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useCallback } from 'react'

export const Route = createFileRoute('/upload')({ component: UploadPage })

interface SampleFile {
  icon: string
  name: string
  rows: string
  cols: string
  filename: string
}

const SAMPLE_FILES: SampleFile[] = [
  {
    icon: '📊',
    name: 'Sales Q3 2025',
    rows: '2,418',
    cols: '12',
    filename: 'sales_q3_2025.csv',
  },
  {
    icon: '👥',
    name: 'HR Headcount',
    rows: '582',
    cols: '9',
    filename: 'hr_headcount.csv',
  },
  {
    icon: '📦',
    name: 'Inventory',
    rows: '1,104',
    cols: '8',
    filename: 'inventory.csv',
  },
  {
    icon: '💰',
    name: 'Finance Q3',
    rows: '890',
    cols: '11',
    filename: 'finance_q3.csv',
  },
  {
    icon: '🎯',
    name: 'Marketing Leads',
    rows: '3,201',
    cols: '14',
    filename: 'marketing_leads.csv',
  },
  {
    icon: '🛠',
    name: 'Support Tickets',
    rows: '674',
    cols: '10',
    filename: 'support_tickets.csv',
  },
]

const TIPS = [
  'A header row with clear column names (row 1)',
  'At least one date or time column',
  'At least one numeric column — revenue, units, count, etc.',
  'UTF-8 encoding — standard Excel and Google Sheets exports work fine',
]

const ACCEPTED = '.csv,.tsv,.xlsx'
const MAX_MB = 50

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['csv', 'tsv', 'xlsx'].includes(ext ?? '')) {
    return `Unsupported file type ".${ext}". Please upload a .csv, .tsv, or .xlsx file.`
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return `File is too large (${formatBytes(file.size)}). Max size is ${MAX_MB} MB.`
  }
  return null
}

function DropZone({
  onFile,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  onFile: (f: File) => void
  isDragging: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={[
        'relative flex cursor-pointer flex-col dark:bg-(--bg-modal)  items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200',
        isDragging
          ? 'border-(--lagoon-deep) bg-[rgba(37,99,235,0.06)] scale-[1.01]'
          : 'border-[rgba(23,58,64,0.2)] bg-white/60 hover:border-[rgba(37,99,235,0.4)] hover:bg-[rgba(37,99,235,0.03)]',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />

      <div
        className={[
          'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-200',
          isDragging
            ? 'scale-110 bg-[rgba(37,99,235,0.12)]'
            : 'bg-[rgba(23,58,64,0.06)]',
        ].join(' ')}
      >
        {isDragging ? '⬇️' : '📂'}
      </div>

      <div>
        <p className="text-sm font-semibold text-(--sea-ink)">
          {isDragging ? 'Drop to upload' : 'Drop your CSV file here'}
        </p>
        <p className="mt-1 text-xs text-(--sea-ink-soft)">
          or click to browse from your computer
        </p>
      </div>

      <span className="rounded-full border border-[rgba(23,58,64,0.12)] bg-[rgba(23,58,64,0.04)] px-3 py-1 text-xs text-(--sea-ink-soft)">
        .csv · .tsv · .xlsx (first sheet) · max {MAX_MB} MB
      </span>
    </div>
  )
}

function SampleFileCard({
  file,
  selected,
  onSelect,
}: {
  file: SampleFile
  selected: boolean
  onSelect: (f: SampleFile) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={[
        'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5',
        selected
          ? 'border-(--lagoon-deep) bg-[rgba(37,99,235,0.06)]'
          : 'border-[rgba(23,58,64,0.14)] bg-(--bg-base) hover:border-[rgba(37,99,235,0.35)]',
      ].join(' ')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(23,58,64,0.06)] text-lg">
        {file.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--sea-ink)">
          {file.name}
        </p>
        <p className="text-xs text-(--sea-ink-soft)">
          {file.rows} rows · {file.cols} cols
        </p>
      </div>
      {selected && (
        <span className="shrink-0 text-xs font-semibold text-(--lagoon-deep)">
          ✓
        </span>
      )}
    </button>
  )
}

function FilePreviewCard({
  file,
  onRemove,
}: {
  file: File | SampleFile
  onRemove: () => void
}) {
  const isReal = file instanceof File
  const name = isReal ? (file as File).name : (file as SampleFile).filename
  const size = isReal
    ? formatBytes((file as File).size)
    : `${(file as SampleFile).rows} rows`
  const icon = isReal ? '📄' : (file as SampleFile).icon

  return (
    <div className="island-shell flex items-center gap-4 rounded-2xl px-5 py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.08)] text-xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--sea-ink)">
          {name}
        </p>
        <p className="text-xs text-(--sea-ink-soft)">
          {size} · Ready to analyze
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-lg px-2 py-1 text-xs transition hover:bg-[rgba(23,58,64,0.08)] hover: text-(--sea-ink)"
      >
        Remove
      </button>
    </div>
  )
}

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="mt-0.5 shrink-0">⚠</span>
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}

function UploadPage() {
  const navigate = useNavigate()

  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | SampleFile | null>(
    null,
  )
  const [selectedSample, setSelectedSample] = useState<SampleFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelected(file)
    }
  }, [])

  const handleFileSelected = (file: File) => {
    const err = isValidFile(file)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setSelectedSample(null)
    setSelectedFile(file)
  }

  const handleSampleSelected = (sample: SampleFile) => {
    setError(null)
    const isSame = selectedSample?.filename === sample.filename
    setSelectedSample(isSame ? null : sample)
    setSelectedFile(isSame ? null : sample)
  }

  const handleContinue = async () => {
    if (!selectedFile) {
      return
    }
    setIsProcessing(true)
    // In production: upload the file, get back a job ID, navigate to /process/:id
    // For now we navigate straight to the processing screen
    await new Promise((r) => setTimeout(r, 400)) // simulate hand-off
    // in handleContinue
    navigate({
      to: '/process',
      search: {
        file:
          selectedFile instanceof File
            ? selectedFile.name
            : (selectedFile as SampleFile).filename,
      },
    })
  }

  const hasSelection = selectedFile !== null

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.14),transparent_66%)]" />

        <p className="island-kicker mb-3">Step 1 of 4</p>
        <h1 className="display-title mb-4 text-3xl font-bold leading-tight tracking-tight   text-(--sea-ink) sm:text-4xl">
          Import your data
        </h1>
        <p className="max-w-xl text-sm text-(--sea-ink-soft) sm:text-base">
          Upload a CSV and Dash AI will detect your columns, infer metrics vs
          dimensions, and build a dashboard in seconds.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {error && (
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          )}

          <DropZone
            onFile={handleFileSelected}
            isDragging={isDragging}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          {hasSelection && (
            <FilePreviewCard
              file={selectedFile!}
              onRemove={() => {
                setSelectedFile(null)
                setSelectedSample(null)
              }}
            />
          )}

          <button
            type="button"
            disabled={!hasSelection || isProcessing}
            onClick={handleContinue}
            className={[
              'w-full rounded-2xl py-3.5 text-sm font-semibold transition',
              hasSelection && !isProcessing
                ? 'bg-(--lagoon-deep) text-white hover:opacity-90 hover:-translate-y-0.5'
                : 'cursor-not-allowed bg-[rgba(118,118,118,0.2)] text-(--sea-ink-soft)',
            ].join(' ')}
          >
            {isProcessing
              ? 'Sending to Dash…'
              : hasSelection
                ? 'Analyze & build dashboard →'
                : 'Select a file to continue'}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <section className="island-shell rounded-2xl p-5">
            <p className="island-kicker mb-4">Or try a sample dataset</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {SAMPLE_FILES.map((f) => (
                <SampleFileCard
                  key={f.filename}
                  file={f}
                  selected={selectedSample?.filename === f.filename}
                  onSelect={handleSampleSelected}
                />
              ))}
            </div>
          </section>

          <section className="island-shell rounded-2xl p-5">
            <p className="island-kicker mb-3">For best results</p>
            <ul className="space-y-2">
              {TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2.5 text-sm text-(--sea-ink-soft)"
                >
                  <span className="mt-0.5 shrink-0 text-(--lagoon-deep) opacity-70">
                    ✓
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
