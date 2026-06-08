"use client"

import { useEffect, useState } from "react"
import { api, UserOut } from "@/lib/api"

export function useAuth() {
  const [user, setUser] = useState<UserOut | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
