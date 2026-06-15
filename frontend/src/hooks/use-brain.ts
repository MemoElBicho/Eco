"use client"

import { useCallback, useEffect, useState } from "react"
import { api, BrainDoc } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

export function useBrain() {
  const { instanceId } = useActiveInstance()
  const [docs, setDocs] = useState<BrainDoc[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const params = instanceId ? { operator_instance_id: instanceId } : undefined
      setDocs(await api.brain.documents(params))
    } catch {}
    finally { setLoading(false) }
  }, [instanceId])

  useEffect(() => { refresh() }, [refresh])

  const upload = useCallback(async (file: File) => {
    await api.brain.upload(file)
    await refresh()
  }, [refresh])

  return { docs, loading, refresh, upload }
}
