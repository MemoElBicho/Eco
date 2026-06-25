"use client"

interface ChannelItem { name: string; pct: number; color: string }

export function ChannelsDonut({ channels }: { channels: ChannelItem[] }) {
  const primary = channels[0]
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Canales</h3>
      <div className="flex items-center gap-6">
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={primary?.color || "var(--green)"} strokeWidth="2" strokeDasharray={`${(primary?.pct || 0) * 1} ${100 - (primary?.pct || 0)}`} strokeLinecap="butt" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--foreground)]">
            {primary?.pct || 0}%
          </span>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {channels.map((ch) => (
            <div key={ch.name} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
              <span className="text-xs text-[var(--t2)] flex-1">{ch.name}</span>
              <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${ch.pct}%`, backgroundColor: ch.color }} />
              </div>
              <span className="text-xs font-medium text-[var(--foreground)] w-8 text-right">{ch.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
