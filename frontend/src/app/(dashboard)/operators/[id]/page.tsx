"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Activity, Bot, Globe, Key, MessageSquare, Users, Zap, Copy, Check } from "lucide-react"
import { api, OperatorInstanceOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border-[rgba(16,185,129,0.3)]",
  paused: "bg-[rgba(245,158,11,0.15)] text-[var(--amber)] border-[rgba(245,158,11,0.3)]",
  deleted: "bg-[rgba(239,68,68,0.15)] text-[var(--red)] border-[rgba(239,68,68,0.3)]",
}

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { instanceId, setActive } = useActiveInstance()
  const [instance, setInstance] = useState<OperatorInstanceOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    api.operators.get(id).then(setInstance).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const copyToken = () => {
    if (!instance) return
    navigator.clipboard.writeText(instance.webhook_token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-[var(--surface)] rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="h-24 rounded-xl bg-[var(--surface)] animate-pulse" />))}
        </div>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-[var(--t2)]">
        <Bot className="h-12 w-12 opacity-20" />
        <p className="text-sm font-medium">Instancia no encontrada.</p>
      </div>
    )
  }

  const isSelected = instanceId === instance.id

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{instance.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_STYLE[instance.status] ?? STATUS_STYLE.active}`}>{instance.status}</span>
            <span className="text-[10px] text-[var(--t2)]">Modelo: {instance.model}</span>
            <span className="text-[10px] text-[var(--t2)]">Creado: {new Date(instance.created_at).toLocaleDateString("es-MX")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {!isSelected && (
            <button onClick={() => setActive(instance.id)} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-medium text-[var(--t2)] hover:text-[var(--foreground)]">
              Activar
            </button>
          )}
          <button className="rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-4 py-1.5 text-xs font-medium text-white">
            Configurar
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--t2)]">Canales</span>
            <Globe className="h-4 w-4 text-[var(--t2)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{instance.channels?.length ?? 0}</p>
          <p className="text-xs text-[var(--t2)]">{instance.channels?.filter((c) => c.is_active).length ?? 0} activos</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--t2)]">Herramientas</span>
            <Zap className="h-4 w-4 text-[var(--t2)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{instance.tools?.length ?? 0}</p>
          <p className="text-xs text-[var(--t2)]">{instance.tools?.filter((t) => t.is_enabled).length ?? 0} activas</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--t2)]">Webhook Token</span>
            <button onClick={copyToken} className="text-[var(--t2)] hover:text-[var(--amber)]">
              {copied ? <Check className="h-4 w-4 text-[var(--green)]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-sm font-mono text-[var(--foreground)] truncate">{instance.webhook_token.slice(0, 16)}...</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--t2)]">System Prompt</span>
            <MessageSquare className="h-4 w-4 text-[var(--t2)]" />
          </div>
          <p className="text-xs text-[var(--t2)] line-clamp-2">{instance.system_prompt?.slice(0, 80) || "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Canales</h3>
          {instance.channels?.length === 0 ? (
            <p className="text-sm text-[var(--t2)]">Sin canales configurados.</p>
          ) : (
            <div className="space-y-2">
              {instance.channels?.map((ch) => (
                <div key={ch.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)] p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)] capitalize">{ch.channel}</p>
                    <p className="text-xs font-mono text-[var(--t2)]">{ch.external_id?.slice(0, 30) || "sin external_id"}</p>
                  </div>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 border ${ch.is_active ? "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border-[rgba(16,185,129,0.3)]" : "bg-[var(--surface)] text-[var(--t2)] border-[var(--border)]"}`}>
                    {ch.is_active ? "activo" : "inactivo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Herramientas</h3>
          {instance.tools?.length === 0 ? (
            <p className="text-sm text-[var(--t2)]">Sin herramientas configuradas.</p>
          ) : (
            <div className="space-y-2">
              {instance.tools?.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)] p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)] capitalize">{tool.tool_type}</p>
                    {tool.config && <p className="text-xs text-[var(--t2)]">{JSON.stringify(tool.config).slice(0, 50)}</p>}
                  </div>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 border ${tool.is_enabled ? "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border-[rgba(16,185,129,0.3)]" : "bg-[var(--surface)] text-[var(--t2)] border-[var(--border)]"}`}>
                    {tool.is_enabled ? "activa" : "inactiva"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
