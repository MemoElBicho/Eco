"use client"

interface SentimentDay { pos: number; neu: number; neg: number }

export function SentimentChart({ data }: { data: SentimentDay[] }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Sentimiento (30d)</h3>
      <div className="flex items-center gap-4 text-xs mb-1">
        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[var(--green)]" /> Positivo</div>
        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[var(--amber)]" /> Neutro</div>
        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[var(--red)]" /> Negativo</div>
      </div>
      <div className="flex items-end gap-0.5 h-24">
        {data.map((d, i) => {
          const total = d.pos + d.neu + d.neg
          return (
            <div key={i} className="flex-1 flex flex-col-reverse h-full rounded-t-sm overflow-hidden">
              <div className="w-full bg-[var(--green)] transition-all" style={{ height: `${(d.pos / total) * 100}%` }} />
              <div className="w-full bg-[var(--amber)] transition-all" style={{ height: `${(d.neu / total) * 100}%` }} />
              <div className="w-full bg-[var(--red)] transition-all" style={{ height: `${(d.neg / total) * 100}%` }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
