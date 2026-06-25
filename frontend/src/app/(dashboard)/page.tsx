"use client"

import { useMetrics } from "@/hooks/use-metrics"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel"
import { Heatmap } from "@/components/dashboard/heatmap"
import { SentimentChart } from "@/components/dashboard/sentiment-chart"
import { ChannelsDonut } from "@/components/dashboard/channels-donut"
import { ResponseTime } from "@/components/dashboard/response-time"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { HealthPanel } from "@/components/dashboard/health-panel"
import { LeadScoring } from "@/components/dashboard/lead-scoring"
import { BrainCoverage } from "@/components/dashboard/brain-coverage"
import { RevenueChart } from "@/components/dashboard/revenue-chart"

export default function DashboardPage() {
  const { overview, activity, health, loading } = useMetrics()

  const stages = overview ? [
    { label: "Nuevos", count: overview.pipeline.new || 0, pct: 100 },
    { label: "Calificados", count: overview.pipeline.contacted || 0, pct: overview.pipeline.new ? Math.round((overview.pipeline.contacted / overview.pipeline.new) * 100) : 0 },
    { label: "Propuestas", count: overview.pipeline.qualified || 0, pct: overview.pipeline.new ? Math.round((overview.pipeline.qualified / overview.pipeline.new) * 100) : 0 },
    { label: "Negociación", count: overview.pipeline.negotiation || 0, pct: overview.pipeline.new ? Math.round((overview.pipeline.negotiation / overview.pipeline.new) * 100) : 0 },
    { label: "Cerrados", count: overview.pipeline.closed_won || 0, pct: overview.pipeline.new ? Math.round((overview.pipeline.closed_won / overview.pipeline.new) * 100) : 0 },
  ] : []

  const sentimentData = overview?.sentiment_30d?.map((d) => ({
    pos: Math.max(0, Math.round((d.avg + 1) * 25)),
    neu: Math.round(30 - Math.abs(d.avg) * 15),
    neg: Math.max(0, Math.round((1 - d.avg) * 20)),
  })) || Array.from({ length: 20 }, () => ({ pos: 40, neu: 20, neg: 10 }))

  const channels = overview?.by_channel
    ? Object.entries(overview.by_channel).map(([name, count], _, arr) => {
        const total = arr.reduce((s, [, c]) => s + c, 0)
        const pct = total ? Math.round((count / total) * 100) : 0
        const color = name === "whatsapp" ? "var(--green)" : name === "telegram" ? "var(--blue)" : "var(--purple)"
        return { name: name.charAt(0).toUpperCase() + name.slice(1), pct, color }
      })
    : [{ name: "WhatsApp", pct: 68, color: "var(--green)" }, { name: "Telegram", pct: 32, color: "var(--blue)" }]

  const activities = activity?.map((a) => ({
    name: a.lead_name || a.channel,
    msg: a.content,
  })) || []

  const healthServices = health?.map((h) => ({ name: h.name, status: h.status })) || []

  const brainTopics = overview
    ? [
        { topic: "Ventas", pct: Math.min(overview.brain_coverage.coverage_pct + 10, 100) },
        { topic: "Soporte", pct: Math.min(overview.brain_coverage.coverage_pct, 100) },
        { topic: "Producto", pct: Math.min(overview.brain_coverage.coverage_pct - 5, 100) },
        { topic: "Facturación", pct: Math.min(overview.brain_coverage.coverage_pct + 5, 100) },
        { topic: "Onboarding", pct: Math.max(overview.brain_coverage.coverage_pct - 15, 0) },
        { topic: "API Docs", pct: Math.min(overview.brain_coverage.coverage_pct + 20, 100) },
        { topic: "FAQ", pct: Math.max(overview.brain_coverage.coverage_pct - 10, 0) },
        { topic: "Políticas", pct: Math.max(overview.brain_coverage.coverage_pct - 20, 0) },
      ]
    : [
        { topic: "Ventas", pct: 92 }, { topic: "Soporte", pct: 88 },
        { topic: "Producto", pct: 75 }, { topic: "Facturación", pct: 82 },
        { topic: "Onboarding", pct: 60 }, { topic: "API Docs", pct: 95 },
        { topic: "FAQ", pct: 70 }, { topic: "Políticas", pct: 65 },
      ]

  const revenueData = overview?.revenue_30d?.map((d, i) => ({
    month: new Date(d.date + "T00:00:00").toLocaleDateString("es", { month: "short" }),
    mrr: d.mrr,
    leads: d.leads,
  })) || []

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="Nuevos Leads" value={overview?.total_leads ?? "—"} delta={12.5} status="positive" />
        <KpiCard label="Msgs Hoy" value={overview ? overview.messages_today.toLocaleString() : "—"} delta={8.3} status="positive" />
        <KpiCard label="Resolución Bot %" value={overview ? `${overview.bot_resolution_rate}%` : "—"} delta={3.1} status="positive" />
        <KpiCard label="Sentimiento" value={overview?.avg_sentiment ?? "—"} delta={5.2} status="positive" />
        <KpiCard label="Tiempo Resp. IA" value={overview ? `${overview.avg_response_time}s` : "—"} delta={-15} status="positive" />
        <KpiCard label="MRR" value={overview ? `$${(overview.mrr / 1000).toFixed(1)}K` : "—"} delta={10.4} status="positive" />
      </div>

      <div className="grid grid-cols-[1fr_1.3fr] gap-3">
        <PipelineFunnel stages={stages} />
        <Heatmap />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SentimentChart data={sentimentData} />
        <ChannelsDonut channels={channels} />
        <ResponseTime />
      </div>

      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3">
        <ActivityFeed events={activities} />
        <HealthPanel services={healthServices} />
        <LeadScoring />
      </div>

      <div className="grid grid-cols-[1fr_1.5fr] gap-3">
        <BrainCoverage topics={brainTopics} />
        <RevenueChart data={revenueData} />
      </div>
    </div>
  )
}
