"use client"

import { MessageCircle, Bot, BotOff } from "lucide-react"

interface Chat {
  lead_id: string
  lead_name: string | null
  channel: string
  last_message: string | null
  last_message_at: string
  bot_active: boolean
  sentiment_label: string
  sentiment: number
}

export function ChatList({
  conversations, loading, selectedId, onSelect,
}: {
  conversations: Chat[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Conversaciones</h3>
        <span className="text-[10px] text-[var(--t2)]">{conversations.length} activas</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <div className="h-9 w-9 rounded-full bg-[var(--surface)] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 bg-[var(--surface)] rounded animate-pulse" />
                  <div className="h-3 w-40 bg-[var(--surface)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-[var(--t2)]">
            <MessageCircle className="size-8 opacity-30" />
            <p className="text-xs">Sin conversaciones</p>
          </div>
        ) : (
          <div className="p-1">
            {conversations.map((c) => (
              <button
                key={c.lead_id}
                onClick={() => onSelect(c.lead_id)}
                className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                  selectedId === c.lead_id
                    ? "bg-[var(--amber-dim)]"
                    : "hover:bg-[var(--surface)]"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {(c.lead_name || "?").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {c.lead_name || "Unknown"}
                    </p>
                    <span className="shrink-0 text-[10px] text-[var(--t2)]">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs text-[var(--t2)]">{c.last_message || "Sin mensajes"}</p>
                    {c.bot_active ? (
                      <div className="flex items-center gap-1 rounded-full bg-[rgba(16,185,129,0.15)] px-1.5 py-0.5">
                        <Bot className="h-2.5 w-2.5 text-[var(--green)]" />
                        <span className="text-[9px] text-[var(--green)]">AI</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.15)] px-1.5 py-0.5">
                        <BotOff className="h-2.5 w-2.5 text-[var(--amber)]" />
                        <span className="text-[9px] text-[var(--amber)]">PAUSED</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
