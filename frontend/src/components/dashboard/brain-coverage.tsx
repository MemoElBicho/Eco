"use client"

interface TopicItem { topic: string; pct: number }

export function BrainCoverage({ topics }: { topics: TopicItem[] }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Brain Coverage</h3>
      <div className="grid grid-cols-4 gap-2">
        {topics.map((t) => (
          <div key={t.topic} className="flex flex-col items-center gap-1 bg-[var(--bg)] rounded-lg p-3">
            <div className="relative h-12 w-12">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="2" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={t.pct >= 80 ? "var(--green)" : t.pct >= 60 ? "var(--amber)" : "var(--red)"} strokeWidth="2" strokeDasharray={`${t.pct * 2.01} 200`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[var(--foreground)]">{t.pct}%</span>
            </div>
            <span className="text-[10px] text-[var(--t2)] text-center truncate w-full">{t.topic}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
