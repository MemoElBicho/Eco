import { MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { ConversationOut } from "@/lib/api"

const CHANNEL_BADGE: Record<string, { variant: "default" | "outline"; label: string }> = {
  whatsapp: { variant: "default", label: "WA" },
  telegram: { variant: "outline", label: "TG" },
}

export function ChatList({
  conversations, loading, selectedId, onSelect,
}: {
  conversations: ConversationOut[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-3 py-3">
        <h3 className="text-sm font-semibold tracking-tight">Live Chats</h3>
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
            <MessageCircle className="size-8 opacity-30" />
            <p className="text-xs">No conversations yet</p>
          </div>
        ) : (
          <div className="p-1">
            {conversations.map((c) => {
              const ch = CHANNEL_BADGE[c.channel] ?? { variant: "outline" as const, label: c.channel }
              return (
                <button
                  key={c.lead_id}
                  onClick={() => onSelect(c.lead_id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/60 ${
                    selectedId === c.lead_id ? "bg-muted" : ""
                  }`}
                >
                  <Avatar size="sm">
                    <AvatarFallback className="text-xs font-semibold uppercase">
                      {(c.lead_name || "?").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                    <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="truncate text-sm font-medium">
                        <span
                          className={`mr-1.5 inline-block size-2 rounded-full ${
                            c.sentiment_label === "positive" ? "bg-green-500" :
                            c.sentiment_label === "negative" ? "bg-red-500" : "bg-yellow-500"
                          }`}
                          title={`Sentiment: ${c.sentiment.toFixed(2)}`}
                        />
                        {c.lead_name || "Unknown"}
                      </p>
                      <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                        {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs text-muted-foreground">{c.last_message || "No messages"}</p>
                      {!c.bot_active && (
                        <span className="shrink-0 size-1.5 rounded-full bg-amber-500" title="Bot paused" />
                      )}
                      <Badge variant={ch.variant} className="h-4 shrink-0 px-1 py-0 text-[0.6rem]">
                        {ch.label}
                      </Badge>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
