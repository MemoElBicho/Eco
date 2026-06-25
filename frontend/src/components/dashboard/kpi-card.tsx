"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  label: string
  value: string | number
  delta: number
  status?: "positive" | "negative" | "neutral"
}

export function KpiCard({ label, value, delta, status }: KpiCardProps) {
  const statusColor =
    status === "positive"
      ? "text-[var(--green)]"
      : status === "negative"
        ? "text-[var(--red)]"
        : "text-[var(--t2)]"

  const Icon = status === "positive" ? TrendingUp : status === "negative" ? TrendingDown : Minus

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--t2)]">{label}</span>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-[var(--foreground)]">{value}</span>
        <div className={`flex items-center gap-1 text-sm ${statusColor}`}>
          <Icon className="h-3.5 w-3.5" />
          <span>{delta > 0 ? "+" : ""}{delta}%</span>
        </div>
      </div>
    </div>
  )
}
