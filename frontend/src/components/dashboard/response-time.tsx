"use client"

const METRICS = [
  { label: "Bot IA", value: "1.2s", pct: 85 },
  { label: "RAG", value: "2.8s", pct: 60 },
  { label: "Humano", value: "45s", pct: 25 },
  { label: "Embedding", value: "0.8s", pct: 90 },
  { label: "Webhook", value: "3.5s", pct: 40 },
]

export function ResponseTime() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Response Time</h3>
      <div className="space-y-2">
        {METRICS.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <span className="text-xs text-[var(--t2)] w-16">{m.label}</span>
            <div className="flex-1 h-5 bg-[var(--border)] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${m.pct}%`,
                  background: `linear-gradient(90deg, var(--amber), rgba(245,158,11,0.4))`,
                }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--foreground)] w-10 text-right">{m.value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
          <span className="text-[10px] text-[var(--t2)]">Bot IA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--blue)]" />
          <span className="text-[10px] text-[var(--t2)]">Humano</span>
        </div>
        <span className="text-xs text-[var(--green)]">+32% vs ayer</span>
      </div>
    </div>
  )
}
