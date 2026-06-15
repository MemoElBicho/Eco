"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "eco_active_instance"

export function useActiveInstance() {
  const [instanceId, setInstanceId] = useState<string | null>(null)

  useEffect(() => {
    setInstanceId(localStorage.getItem(STORAGE_KEY))
    const onStorage = () => setInstanceId(localStorage.getItem(STORAGE_KEY))
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const setActive = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setInstanceId(id)
  }, [])

  return { instanceId, setActive }
}
