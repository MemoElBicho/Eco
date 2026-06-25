"use client"

import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, Bot, BotOff, ChevronDown } from "lucide-react"
import { MessageBubble } from "./message-bubble"

interface Message {
  id: string
  content: string
  direction: "in" | "out" | string
  created_at: string
}

interface Conversation {
  lead_id: string
  lead_name: string | null
  channel: string
  bot_active: boolean
}

export function ChatWindow({
  conversation, messages, loading, onSend, onToggleBot, isTyping,
}: {
  conversation: Conversation | undefined
  messages: Message[]
  loading: boolean
  onSend: (text: string) => Promise<void>
  onToggleBot?: () => Promise<void>
  isTyping?: boolean
}) {
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const handleSend = () => {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft("")
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--t2)]">
        <MessageSquare className="size-12 opacity-20" />
        <p className="text-sm font-medium">Selecciona una conversación</p>
        <p className="text-xs">Elige un chat del panel izquierdo</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-4 py-3 bg-[var(--bg2)]">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {(conversation.lead_name || "?").slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">{conversation.lead_name || "Unknown"}</p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--t2)]">
            <span className="capitalize">{conversation.channel}</span>
            <span className="opacity-40">&middot;</span>
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${conversation.bot_active ? "bg-[var(--green)] animate-pulse" : "bg-[var(--amber)]"}`} />
              <span className={conversation.bot_active ? "text-[var(--green)]" : "text-[var(--amber)]"}>
                {conversation.bot_active ? "AI activo" : "AI pausado"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onToggleBot}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            conversation.bot_active
              ? "bg-[var(--surface)] text-[var(--t2)] hover:bg-[var(--amber-dim)] hover:text-[var(--amber)]"
              : "bg-[var(--amber)] text-white hover:bg-[var(--amber)]/90"
          }`}
        >
          {conversation.bot_active ? <BotOff className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          {conversation.bot_active ? "Pause AI" : "Resume AI"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full p-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className={`h-16 rounded-2xl animate-pulse bg-[var(--surface)] ${i % 2 === 0 ? "w-3/5" : "w-2/5"}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12 text-xs text-[var(--t2)]">
              No hay mensajes aún. Inicia la conversación.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
          {isTyping && (
            <div className="flex justify-start mt-2">
              <div className="bg-[var(--surface)] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-[var(--t2)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-[var(--t2)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-[var(--t2)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
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
    </div>
  )
}


