import { useCallback, useEffect, useState } from "react"
import { api, LeadOut } from "@/lib/api"

export function useLeads() {
  const [leads, setLeads] = useState<LeadOut[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setLeads(await api.leads.list()) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const remove = useCallback(async (id: string) => {
    await api.leads.delete(id)
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const create = useCallback(async (body: Parameters<typeof api.leads.create>[0]) => {
    const lead = await api.leads.create(body)
    setLeads((prev) => [lead, ...prev])
    return lead
  }, [])

  return { leads, loading, refresh, remove, create }
}
