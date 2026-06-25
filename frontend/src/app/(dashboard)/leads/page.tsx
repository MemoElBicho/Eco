"use client"

import { useState } from "react"
import { Search, Plus, BotOff, Bot, Send } from "lucide-react"
import { useLeads } from "@/hooks/use-leads"
import { useMessages } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"
import { useWebSocket } from "@/hooks/use-websocket"
import { api } from "@/lib/api"

const STATUS_STYLE: Record<string, string> = {
  new: "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)]",
  contacted: "bg-[rgba(59,130,246,0.15)] text-[var(--blue)] border border-[rgba(59,130,246,0.3)]",
  qualified: "bg-[rgba(139,92,246,0.15)] text-[var(--purple)] border border-[rgba(139,92,246,0.3)]",
  negotiation: "bg-[rgba(245,158,11,0.15)] text-[var(--amber)] border border-[rgba(245,158,11,0.3)]",
  closed_won: "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)]",
  closed_lost: "bg-[rgba(239,68,68,0.15)] text-[var(--red)] border border-[rgba(239,68,68,0.3)]",
}

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: "😀",
  neutral: "😐",
  negative: "😞",
}

const SENTIMENT_BAR: Record<string, string> = {
  positive: "bg-[var(--green)]",
  neutral: "bg-[var(--amber)]",
  negative: "bg-[var(--red)]",
}

export default function LeadsPage() {
  const { user } = useAuth()
  const { leads, loading: leadsLoading } = useLeads()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { messages, loading: msgsLoading, refresh, pushMessage } = useMessages(selectedId)
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")

  const active = leads.find((l) => l.id === selectedId)

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || !selectedId) return
    setDraft("")
    await api.conversations.sendManual(selectedId, text)
    await refresh()
  }

  const handleToggleBot = async () => {
    if (!selectedId) return
    await api.conversations.toggleBot(selectedId)
    window.location.reload()
  }

  useWebSocket(user?.workspace_id ?? null, (msg) => {
    if (msg.lead_id === selectedId) pushMessage(msg)
  })

  const filtered = leads.filter(
    (l) =>
      (l.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.phone ?? "").includes(search) ||
      (l.email ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  const scoreColor = (s: number) => s >= 70 ? "bg-[var(--green)]" : s >= 40 ? "bg-[var(--amber)]" : "bg-[var(--red)]"

  return (
    <div className="flex h-full gap-3">
      <div className="w-80 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Leads</h3>
            <button className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-3 py-1 text-xs font-medium text-white">
              <Plus className="h-3 w-3" />
              Add Lead
            </button>
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--t2)]" />
            <input
              placeholder="Buscar..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-full pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--t2)] outline-none focus:border-[var(--amber)] transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leadsLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                  <div className="h-8 w-8 rounded-full bg-[var(--bg)] animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-[var(--bg)] rounded animate-pulse" />
                    <div className="h-3 w-32 bg-[var(--bg)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-[var(--t2)]">
              <p className="text-xs">{search ? "Sin resultados." : "No hay leads aún."}</p>
            </div>
          ) : (
            <div className="p-1 space-y-0.5">
              {filtered.map((lead) => {
                const isSelected = selectedId === lead.id
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedId(lead.id)}
                    className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                      isSelected ? "bg-[var(--amber-dim)]" : "hover:bg-[var(--bg)]"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-white">{(lead.name || "?").slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">{lead.name || "Sin nombre"}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[lead.status] ?? "bg-[var(--surface)] text-[var(--t2)]"}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--t2)]">
                        <span>{SENTIMENT_EMOJI[lead.sentiment_label] ?? "😐"}</span>
                        <div className="flex-1 h-1 bg-[var(--border)] rounded-full max-w-[60px] overflow-hidden">
                          <div className={`h-full rounded-full ${SENTIMENT_BAR[lead.sentiment_label] ?? "bg-[var(--amber)]"}`} style={{ width: `${Math.abs(lead.sentiment ?? 0) * 100}%` }} />
                        </div>
                        <span className="capitalize">{lead.channel}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--t2)] h-full">
            <p className="text-sm font-medium">Selecciona un lead</p>
            <p className="text-xs">Elige un contacto para ver la conversación.</p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-4 py-3 bg-[var(--bg2)]">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">{(active.name || "?").slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{active.name || "Sin nombre"}</p>
                <div className="flex items-center gap-1.5 text-xs text-[var(--t2)]">
                  <span className="capitalize">{active.channel}</span>
                  <span className="opacity-40">&middot;</span>
                  <span>{SENTIMENT_EMOJI[active.sentiment_label] ?? "😐"} {(active.sentiment ?? 0).toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleToggleBot}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-[var(--surface)] text-[var(--t2)] hover:bg-[var(--amber-dim)] hover:text-[var(--amber)] transition-colors"
              >
                {active.bot_active ? <BotOff className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                {active.bot_active ? "Pause AI" : "Resume AI"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="min-h-full p-4">
                {msgsLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <div className={`h-16 rounded-2xl animate-pulse bg-[var(--bg)] ${i % 2 === 0 ? "w-2/5" : "w-3/5"}`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center py-12 text-xs text-[var(--t2)]">
                    Sin mensajes aún. Inicia la conversación.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex gap-2 ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.direction === "out"
                            ? "rounded-2xl rounded-br-md bg-gradient-to-r from-[var(--amber)] to-orange-600 text-white"
                            : "rounded-2xl rounded-bl-md bg-[var(--bg)] text-[var(--foreground)]"
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={`mt-1 text-right text-[10px] ${m.direction === "out" ? "text-white/60" : "text-[var(--t2)]"}`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t border-[var(--border)] px-4 py-3 bg-[var(--bg2)]">
              <input
                placeholder="Escribe un mensaje..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--t2)] outline-none focus:border-[var(--amber)] transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
