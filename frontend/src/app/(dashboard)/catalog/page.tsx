"use client"

import { useEffect, useState } from "react"
import { Bot, ChevronRight } from "lucide-react"
import { DeployWizard } from "../_components/DeployWizard"

type Template = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  default_tools: string[]
  default_channels: string[]
  config_schema: Record<string, unknown> | null
  icon_url: string | null
  version: string
}

export default function CatalogPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Template | null>(null)

  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL
    if (!BASE) return
    fetch(`${BASE}/catalog/`)
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Catálogo de Operadores</h2>
        <p className="text-sm text-[var(--t2)]">Selecciona una plantilla y despliega tu operador autónomo.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-[var(--surface)] animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center text-[var(--t2)]">No hay plantillas disponibles en el catálogo.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--amber-dim)] transition-colors">
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{t.name}</h3>
                    <span className="text-[10px] rounded-full bg-[var(--bg)] text-[var(--t2)] px-2 py-0.5 mt-1 inline-block">{t.category}</span>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-xs text-[var(--t2)] line-clamp-2 flex-1">{t.description}</p>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {t.default_channels.map((c) => (
                      <span key={c} className="text-[10px] rounded-full bg-[rgba(59,130,246,0.15)] text-[var(--blue)] border border-[rgba(59,130,246,0.3)] px-2 py-0.5">{c}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {t.default_tools.map((tool) => (
                      <span key={tool} className="text-[10px] rounded-full bg-[var(--bg)] text-[var(--t2)] border border-[var(--border)] px-2 py-0.5">{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(t)}
                className="flex items-center justify-center gap-1 w-full border-t border-[var(--border)] py-2.5 text-xs font-medium text-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors"
              >
                Desplegar <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DeployWizard template={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  )
}
