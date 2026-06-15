"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL no esta definida. Debe configurarse en el entorno de build."
  )
}
const BASE = process.env.NEXT_PUBLIC_API_URL

export default function CatalogPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Template | null>(null)

  useEffect(() => {
    fetch(`${BASE}/catalog/`)
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Catálogo de Operadores
        </h2>
        <p className="text-muted-foreground">
          Selecciona una plantilla y despliega tu operador autónomo.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No hay plantillas disponibles en el catálogo.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{t.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1.5">
                      {t.category}
                    </Badge>
                  </div>
                  {t.icon_url && (
                    <img
                      src={t.icon_url}
                      alt=""
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                  )}
                </div>
                <CardDescription className="line-clamp-3 pt-1">
                  {t.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    Canales:
                  </span>
                  {t.default_channels.map((c) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    Tools:
                  </span>
                  {t.default_tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setSelected(t)}>
                  Desplegar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <DeployWizard
        template={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
