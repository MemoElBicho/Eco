"use client"

import { useState } from "react"
import {
  Ban,
  Bot,
  BotOff,
  MessageSquare,
  Search,
  Send,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLeads } from "@/hooks/use-leads"
import { useMessages } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"
import { useWebSocket } from "@/hooks/use-websocket"
import { api, ConversationOut, LeadOut } from "@/lib/api"
import { cn } from "@/lib/utils"

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "default",
  contacted: "secondary",
  qualified: "outline",
  negotiation: "secondary",
  closed_won: "default",
  closed_lost: "destructive",
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: "bg-green-500",
  negative: "bg-red-500",
  neutral: "bg-yellow-500",
}

function LeadListItem({
  lead,
  selected,
  onClick,
}: {
  lead: LeadOut
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/60",
        selected && "bg-muted",
      )}
    >
      <Avatar size="sm">
        <AvatarFallback className="text-xs font-semibold uppercase">
          {(lead.name || "?").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <p className="truncate text-sm font-medium">
            {lead.name || "Sin nombre"}
          </p>
          <Badge
            variant={STATUS_VARIANTS[lead.status] ?? "default"}
            className="shrink-0 text-[0.6rem] px-1.5 h-4"
          >
            {lead.status}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`inline-block size-1.5 rounded-full ${SENTIMENT_DOT[lead.sentiment_label] ?? "bg-yellow-500"}`}
          />
          <span className="capitalize">{lead.channel}</span>
          <span className="opacity-40">&middot;</span>
          <span>
            {new Date(lead.updated_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </div>
    </button>
  )
}

function MessageBubble({
  direction,
  content,
  time,
}: {
  direction: string
  content: string
  time: string
}) {
  const isOut = direction === "out"
  return (
    <div
      className={cn("flex gap-2", isOut ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isOut
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        <p
          className={cn(
            "mt-1 text-right text-[0.65rem] opacity-60",
            isOut && "text-primary-foreground",
          )}
        >
          {new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const { user } = useAuth()
  const { leads, loading: leadsLoading } = useLeads()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const {
    messages,
    loading: msgsLoading,
    refresh,
    pushMessage,
  } = useMessages(selectedId)
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card
        className="flex w-80 shrink-0 flex-col overflow-hidden"
        size="sm"
      >
        <div className="shrink-0 border-b px-3 py-3">
          <h3 className="text-sm font-semibold tracking-tight">Leads</h3>
          <div className="relative mt-2">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {leadsLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-2.5"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <MessageSquare className="size-8 opacity-30" />
              <p className="text-xs">
                {search
                  ? "Sin resultados."
                  : "No hay leads aún."}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((lead) => (
                <LeadListItem
                  key={lead.id}
                  lead={lead}
                  selected={selectedId === lead.id}
                  onClick={() => setSelectedId(lead.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Card
        className="flex flex-1 flex-col overflow-hidden"
        size="sm"
      >
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="size-12 opacity-20" />
            <p className="text-sm font-medium">
              Selecciona un lead
            </p>
            <p className="text-xs">
              Elige un contacto para ver la conversación.
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
              <Avatar size="sm">
                <AvatarFallback className="text-xs font-semibold uppercase">
                  {(active.name || "?").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {active.name || "Sin nombre"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="capitalize">
                    {active.channel}
                  </span>
                  <span className="opacity-40">&middot;</span>
                  <span
                    className={
                      active.sentiment_label === "positive"
                        ? "text-green-600"
                        : active.sentiment_label === "negative"
                          ? "text-red-600"
                          : ""
                    }
                  >
                    Sentimiento: {active.sentiment.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleToggleBot}
                title={active.bot_active ? "Pausar bot" : "Activar bot"}
              >
                {active.bot_active ? (
                  <BotOff className="size-4 text-amber-500" />
                ) : (
                  <Bot className="size-4 text-green-600" />
                )}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="min-h-full p-4">
                {msgsLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                      >
                        <Skeleton
                          className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-2/5" : "w-3/5"}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center py-12 text-xs text-muted-foreground">
                    Sin mensajes aún. Inicia la conversación.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        direction={m.direction}
                        content={m.content}
                        time={m.created_at}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex shrink-0 items-center gap-2 border-t p-3">
              <Input
                placeholder="Escribe un mensaje..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!draft.trim()}
              >
                <Send />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
