"use client"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const data = DAYS.map(() =>
  HOURS.map(() => Math.floor(Math.random() * 100))
)

const getColor = (v: number) => {
  if (v > 75) return "bg-[var(--amber)]"
  if (v > 50) return "bg-[var(--amber)]/60"
  if (v > 25) return "bg-[var(--amber)]/30"
  return "bg-[var(--border)]"
}

export function Heatmap() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Heatmap de Mensajes</h3>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-0.5 min-w-[600px]">
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-[8px] text-[var(--t2)] text-center">
              {h.toString().padStart(2, "0")}
            </div>
          ))}
          {DAYS.map((day, di) => (
            <>
              <div key={day} className="text-[10px] text-[var(--t2)] text-right pr-1 leading-4">
                {day}
              </div>
              {data[di].map((v, hi) => (
                <div
                  key={`${di}-${hi}`}
                  className={`h-3 w-full rounded-sm ${getColor(v)}`}
                  title={`${day} ${hi}:00 — ${v} mensajes`}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
