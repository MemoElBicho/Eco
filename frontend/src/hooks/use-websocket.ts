"use client"

import { useEffect, useRef } from "react"
import type { MessageOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

if (!process.env.NEXT_PUBLIC_WS_URL) {
  throw new Error(
    "NEXT_PUBLIC_WS_URL no esta definida. Debe configurarse en el entorno de build."
  )
}
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL

export function useWebSocket(
  workspaceId: string | null,
  onMessage: (msg: MessageOut) => void,
) {
  const { instanceId } = useActiveInstance()
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!workspaceId) return
    const wsId = instanceId || workspaceId
    const ws = new WebSocket(`${WS_BASE}/${wsId}`)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "new_message" && data.message) {
          onMessageRef.current({ ...data.message, lead_id: data.lead_id })
        }
      } catch {}
    }
    return () => ws.close()
  }, [workspaceId, instanceId])
}
