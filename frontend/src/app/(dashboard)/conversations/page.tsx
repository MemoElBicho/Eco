"use client"

import { useCallback, useState } from "react"
import { Card } from "@/components/ui/card"
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
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="flex w-80 shrink-0 flex-col overflow-hidden" size="sm">
        <ChatList
          conversations={conversations}
          loading={listLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden" size="sm">
        <ChatWindow
          conversation={active}
          messages={messages}
          loading={msgLoading}
          onSend={handleSend}
          onToggleBot={handleToggleBot}
        />
      </Card>
    </div>
  )
}
