import { useEffect, useRef, useState } from "react"
import { Send, MessageSquare, Bot, BotOff } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { ConversationOut, MessageOut } from "@/lib/api"
import { MessageBubble } from "./message-bubble"

export function ChatWindow({
  conversation, messages, loading, onSend, onToggleBot,
}: {
  conversation: ConversationOut | undefined
  messages: MessageOut[]
  loading: boolean
  onSend: (text: string) => Promise<void>
  onToggleBot?: () => Promise<void>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageSquare className="size-12 opacity-20" />
        <p className="text-sm font-medium">Select a conversation</p>
        <p className="text-xs">Choose a chat from the left panel to view messages</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Avatar size="sm">
          <AvatarFallback className="text-xs font-semibold uppercase">
            {(conversation.lead_name || "?").slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{conversation.lead_name || "Unknown"}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="capitalize">{conversation.channel}</span>
            <span className="opacity-40">&middot;</span>
            <span className={conversation.bot_active ? "text-green-600" : "text-amber-500"}>
              {conversation.bot_active ? "AI active" : "AI paused"}
            </span>
          </div>
        </div>
        <Button
          variant={conversation.bot_active ? "outline" : "default"}
          size="xs"
          className="gap-1"
          onClick={onToggleBot}
        >
          {conversation.bot_active ? <BotOff /> : <Bot />}
          {conversation.bot_active ? "Pause AI" : "Resume AI"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="min-h-full p-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? "w-3/5" : "w-2/5"}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12 text-xs text-muted-foreground">
              No messages yet. Start the conversation.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex shrink-0 items-center gap-2 border-t p-3">
        <Input
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        />
        <Button size="sm" onClick={handleSend} disabled={!draft.trim()}>
          <Send />
        </Button>
      </div>
    </div>
  )
}
