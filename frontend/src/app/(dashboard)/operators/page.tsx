"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bot, ExternalLink, MoreVertical, Trash2, Play, CheckCircle } from "lucide-react"
import { api, OperatorInstanceOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

const STATUS_STYLE: Record<string, string> = {
  active: "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border-[rgba(16,185,129,0.3)]",
  paused: "bg-[rgba(245,158,11,0.15)] text-[var(--amber)] border-[rgba(245,158,11,0.3)]",
  deleted: "bg-[rgba(239,68,68,0.15)] text-[var(--red)] border-[rgba(239,68,68,0.3)]",
  deploying: "bg-[rgba(59,130,246,0.15)] text-[var(--blue)] border-[rgba(59,130,246,0.3)]",
}

export default function OperatorsPage() {
  const [instances, setInstances] = useState<OperatorInstanceOut[]>([])
  const [loading, setLoading] = useState(true)
  const { instanceId, setActive } = useActiveInstance()

  useEffect(() => {
    api.operators.list().then(setInstances).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    await api.operators.delete(id)
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, status: "deleted" } : i)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Mis Bots</h2>
          <p className="text-sm text-[var(--t2)]">Instancias de operadores desplegadas.</p>
        </div>
        <Link href="/catalog" className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-4 py-2 text-xs font-medium text-white">
          <Bot className="h-3.5 w-3.5" /> Nuevo Bot
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-40 rounded-xl bg-[var(--surface)] animate-pulse" />))}
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--t2)]">
          <Bot className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">No tienes bots aún.</p>
          <Link href="/catalog" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--t2)] hover:text-[var(--foreground)]">Ir al catálogo</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((inst) => {
            const isActive = inst.id === instanceId
            return (
              <div key={inst.id} className={`relative flex flex-col rounded-lg border ${isActive ? "border-[var(--amber)]" : "border-[var(--border)]"} bg-[var(--surface)] overflow-hidden transition-colors hover:border-[var(--amber-dim)]`}>
                {isActive && (
                  <span className="absolute -top-1.5 right-3 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-2 py-0.5 text-[9px] font-medium text-white">Activo</span>
                )}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{inst.name}</h3>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${STATUS_STYLE[inst.status] ?? STATUS_STYLE.active}`}>{inst.status}</span>
                    </div>
                    <div className="relative group">
                      <button className="p-1 rounded hover:bg-[var(--surface)] text-[var(--t2)] hover:text-[var(--foreground)]">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-[var(--border)] bg-[var(--bg2)] shadow-xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button onClick={() => { setActive(inst.id); (document.activeElement as HTMLElement)?.blur() }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--t2)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]">
                          <Play className="h-3 w-3" /> Activar
                        </button>
                        <button onClick={() => { handleDelete(inst.id); (document.activeElement as HTMLElement)?.blur() }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--red)] hover:bg-[var(--red-dim)]">
                          <Trash2 className="h-3 w-3" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {inst.channels?.map((ch) => (
                      <span key={ch.id} className={`text-[9px] rounded-full px-2 py-0.5 border ${ch.is_active ? "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border-[rgba(16,185,129,0.3)]" : "bg-[var(--bg)] text-[var(--t2)] border-[var(--border)]"}`}>{ch.channel}</span>
                    ))}
                  </div>
                </div>
                <div className="flex border-t border-[var(--border)]">
                  <button onClick={() => setActive(inst.id)} className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${isActive ? "bg-[var(--amber-dim)] text-[var(--amber)]" : "text-[var(--t2)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"}`}>
                    {isActive ? <CheckCircle className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                    {isActive ? "Seleccionado" : "Seleccionar"}
                  </button>
                  <Link href={`/operators/${inst.id}`} className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-[var(--t2)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] border-l border-[var(--border)] transition-colors">
                    Dashboard
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
