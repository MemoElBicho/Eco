"use client"

import { useCallback, useState } from "react"
import { ChatList } from "@/components/conversations/chat-list"
import { ChatWindow } from "@/components/conversations/chat-window"
import { useConversations, useMessages } from "@/hooks/use-conversations"
import { useAuth } from "@/hooks/use-auth"
import { useWebSocket } from "@/hooks/use-websocket"
import { api } from "@/lib/api"

export default function ConversationsPage() {
  const { user } = useAuth()
  const { conversations, loading: listLoading } = useConversations()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { messages, loading: msgLoading, refresh, pushMessage } = useMessages(selectedId)

  const active = conversations.find((c) => c.lead_id === selectedId)

  const handleSend = useCallback(async (text: string) => {
    if (!selectedId) return
    await api.conversations.sendManual(selectedId, text)
    await refresh()
  }, [selectedId, refresh])

  const handleToggleBot = useCallback(async () => {
    if (!selectedId) return
    await api.conversations.toggleBot(selectedId)
    window.location.reload()
  }, [selectedId])

  useWebSocket(user?.workspace_id ?? null, (msg) => {
    pushMessage(msg)
  })

  return (
    <div className="flex h-full gap-3">
      <div className="w-80 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <ChatList
          conversations={conversations}
          loading={listLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <ChatWindow
          conversation={active}
          messages={messages}
          loading={msgLoading}
          onSend={handleSend}
          onToggleBot={handleToggleBot}
        />
      </div>
    </div>
  )
}
