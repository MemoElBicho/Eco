import { useCallback, useEffect, useState } from "react"
import { api, BrainDoc } from "@/lib/api"

export function useBrain() {
  const [docs, setDocs] = useState<BrainDoc[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setDocs(await api.brain.documents()) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const upload = useCallback(async (file: File) => {
    await api.brain.upload(file)
    await refresh()
  }, [refresh])

  return { docs, loading, refresh, upload }
}
