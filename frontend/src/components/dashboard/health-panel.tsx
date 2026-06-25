"use client"

interface HealthService { name: string; status: string }

const STATUS = {
  online: { dot: "bg-[var(--green)]", label: "Online" },
  warning: { dot: "bg-[var(--amber)]", label: "Alerta" },
  error: { dot: "bg-[var(--red)]", label: "Error" },
  offline: { dot: "bg-[var(--red)]", label: "Offline" },
}

export function HealthPanel({ services }: { services: HealthService[] }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Health Panel</h3>
      <div className="grid grid-cols-2 gap-2">
        {services.map((s) => {
          const st = STATUS[s.status as keyof typeof STATUS] || STATUS.warning
          return (
            <div key={s.name} className="flex items-center gap-2 bg-[var(--bg)] rounded-md px-3 py-2">
              <div className={`h-2 w-2 rounded-full ${st.dot} ${s.status === "online" ? "animate-pulse" : ""}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--foreground)] truncate">{s.name}</div>
                <div className="text-[10px] text-[var(--t2)]">{st.label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
