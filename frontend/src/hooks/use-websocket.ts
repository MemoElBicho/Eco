"use client"

import { useEffect, useRef } from "react"
import type { MessageOut } from "@/lib/api"

export function useWebSocket(
  workspaceId: string | null,
  onMessage: (msg: MessageOut) => void,
) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!workspaceId) return
    const WS_BASE = process.env.NEXT_PUBLIC_WS_URL
    if (!WS_BASE) return
    const ws = new WebSocket(`${WS_BASE}/${workspaceId}`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "new_message" && data.message) {
          onMessageRef.current({ ...data.message, lead_id: data.lead_id })
        }
      } catch {}
    }
    return () => ws.close()
  }, [workspaceId])
}
