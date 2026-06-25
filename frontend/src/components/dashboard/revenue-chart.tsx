"use client"

interface RevenueItem { month: string; mrr: number; leads: number }

export function RevenueChart({ data }: { data: RevenueItem[] }) {
  const maxMrr = Math.max(...data.map((d) => d.mrr))
  const maxLeads = Math.max(...data.map((d) => d.leads))
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Revenue & Leads (30d)</h3>
      <div className="flex items-center gap-4 text-xs mb-1">
        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[var(--amber)]" /> MRR</div>
        <div className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-[var(--cyan)]" /> Leads</div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full bg-[var(--cyan)] rounded-t-sm transition-all" style={{ height: `${maxLeads > 0 ? (d.leads / maxLeads) * 60 : 0}%` }} />
            <div className="w-full bg-[var(--amber)] rounded-t-sm transition-all" style={{ height: `${maxMrr > 0 ? (d.mrr / maxMrr) * 100 : 0}%` }} />
            <span className="text-[9px] text-[var(--t2)]">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
