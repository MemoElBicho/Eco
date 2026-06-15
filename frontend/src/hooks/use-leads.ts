"use client"

import { useCallback, useEffect, useState } from "react"
import { api, LeadOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

export function useLeads() {
  const { instanceId } = useActiveInstance()
  const [leads, setLeads] = useState<LeadOut[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const params = instanceId ? { operator_instance_id: instanceId } : undefined
      setLeads(await api.leads.list(params))
    } catch {}
    finally { setLoading(false) }
  }, [instanceId])

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
