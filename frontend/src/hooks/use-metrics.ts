"use client"

import { useEffect, useState } from "react"

export interface MetricsOverview {
  total_leads: number
  total_messages: number
  messages_today: number
  bot_resolution_rate: number
  avg_sentiment: number
  avg_response_time: number
  mrr: number
  pipeline: Record<string, number>
  by_channel: Record<string, number>
  sentiment_30d: { date: string; avg: number }[]
  revenue_30d: { date: string; mrr: number; leads: number }[]
  brain_coverage: { documents: number; coverage_pct: number }
}

export interface ActivityEvent {
  type: string
  channel: string
  lead_name: string | null
  content: string
  direction: string
  timestamp: string
}

export interface HealthItem {
  name: string
  status: string
  count?: string
}

const BASE = process.env.NEXT_PUBLIC_API_URL || ""

async function fetchMetric<T>(path: string): Promise<T | null> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (!token || !BASE) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function useMetrics() {
  const [overview, setOverview] = useState<MetricsOverview | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [health, setHealth] = useState<HealthItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMetric<MetricsOverview>("/api/v1/metrics/overview"),
      fetchMetric<ActivityEvent[]>("/api/v1/metrics/activity"),
      fetchMetric<HealthItem[]>("/api/v1/metrics/health"),
    ]).then(([o, a, h]) => {
      if (o) setOverview(o)
      if (a) setActivity(Array.isArray(a) ? a : [])
      if (h) setHealth(Array.isArray(h) ? h : [])
    }).finally(() => setLoading(false))
  }, [])

  return { overview, activity, health, loading }
}
