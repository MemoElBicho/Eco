"use client"

interface Stage { label: string; count: number; pct: number }

export function PipelineFunnel({ stages }: { stages: Stage[] }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Pipeline Funnel</h3>
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-xs text-[var(--t2)] w-24 text-right">{s.label}</span>
            <div className="flex-1 h-7 bg-[var(--border)] rounded overflow-hidden">
              <div
                className="h-full rounded flex items-center px-2"
                style={{
                  width: `${s.pct}%`,
                  background: `linear-gradient(90deg, rgba(245,158,11,0.${6 + i}), rgba(245,158,11,0.${3 + i}))`,
                }}
              >
                <span className="text-xs font-medium text-white">{s.pct}%</span>
              </div>
            </div>
            <span className="text-xs text-[var(--t2)] w-12">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
