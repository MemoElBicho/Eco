"use client"

import { Bot, MessageSquare, Globe } from "lucide-react"

const LEADS = [
  { name: "Carlos M.", channel: "WhatsApp", score: 92, sentiment: "😀", icon: MessageSquare },
  { name: "Ana G.", channel: "Telegram", score: 85, sentiment: "😀", icon: Bot },
  { name: "Luis R.", channel: "WhatsApp", score: 78, sentiment: "😐", icon: MessageSquare },
  { name: "Sofia T.", channel: "Web", score: 65, sentiment: "🙂", icon: Globe },
  { name: "Pedro L.", channel: "WhatsApp", score: 58, sentiment: "😐", icon: MessageSquare },
  { name: "Mía S.", channel: "Telegram", score: 45, sentiment: "😞", icon: Bot },
]

export function LeadScoring() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Lead Scoring</h3>
      <div className="space-y-2">
        {LEADS.map((l) => {
          const scoreColor = l.score >= 80 ? "bg-[var(--green)]" : l.score >= 60 ? "bg-[var(--amber)]" : "bg-[var(--red)]"
          return (
            <div key={l.name} className="flex items-center gap-3 py-1.5">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center">
                <l.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--foreground)]">{l.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{l.sentiment}</span>
                    <span className="text-xs font-semibold text-[var(--foreground)]">{l.score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--t2)]">{l.channel}</span>
                  <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreColor}`} style={{ width: `${l.score}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
