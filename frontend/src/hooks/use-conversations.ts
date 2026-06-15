"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ConversationOut, MessageOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

export function useConversations() {
  const { instanceId } = useActiveInstance()
  const [conversations, setConversations] = useState<ConversationOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = instanceId ? { operator_instance_id: instanceId } : undefined
    api.conversations.list(params)
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [instanceId])

  return { conversations, loading }
}

export function useMessages(leadId: string | null) {
  const [messages, setMessages] = useState<MessageOut[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!leadId) { setMessages([]); return }
    setLoading(true)
    try { setMessages(await api.conversations.messages(leadId)) }
    catch {}
    finally { setLoading(false) }
  }, [leadId])

  useEffect(() => { refresh() }, [refresh])

  const pushMessage = useCallback((msg: MessageOut) => {
    if (msg.lead_id === leadId) {
      setMessages((prev) => [...prev, msg])
    }
  }, [leadId])

  return { messages, loading, refresh, pushMessage }
}
