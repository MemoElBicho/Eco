"use client"

import { Activity, UserCheck, FileText, AlertTriangle } from "lucide-react"

const ICON_MAP: Record<string, typeof Activity> = {
  message: Activity,
  sync: UserCheck,
  document: FileText,
  alert: AlertTriangle,
}

const COLOR_MAP: Record<string, string> = {
  message: "text-[var(--green)]",
  sync: "text-[var(--blue)]",
  document: "text-[var(--purple)]",
  alert: "text-[var(--amber)]",
}

const EVENT_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  Bot: { icon: Activity, color: "text-[var(--green)]" },
  HubSpot: { icon: UserCheck, color: "text-[var(--blue)]" },
  RAG: { icon: FileText, color: "text-[var(--purple)]" },
  Sistema: { icon: AlertTriangle, color: "text-[var(--amber)]" },
  Leads: { icon: UserCheck, color: "text-[var(--blue)]" },
}

export function ActivityFeed({ events }: { events: { name: string; msg: string }[] }) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Activity Feed</h3>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-[var(--t2)] text-center py-4">Sin actividad reciente</p>
        ) : (
          events.map((e, i) => {
            const match = Object.entries(EVENT_ICONS).find(([k]) => e.name.includes(k))
            const { icon: Icon, color } = match ? match[1] : EVENT_ICONS.Sistema
            return (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--foreground)]">{e.name}</span>
                  </div>
                  <p className="text-xs text-[var(--t2)] truncate">{e.msg}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
