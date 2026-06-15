"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Activity,
  Bot,
  Globe,
  Key,
  MessageSquare,
  Settings,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api, OperatorInstanceOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

const STATUS_CLASS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  deleted: "bg-red-100 text-red-700",
}

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { instanceId, setActive } = useActiveInstance()
  const [instance, setInstance] = useState<OperatorInstanceOut | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.operators.get(id)
      .then(setInstance)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Bot className="size-12 opacity-20" />
        <p className="text-sm font-medium">Instancia no encontrada.</p>
      </div>
    )
  }

  const isSelected = instanceId === instance.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {instance.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[instance.status] ?? STATUS_CLASS.active}`}
            >
              {instance.status}
            </span>
            <span className="text-xs text-muted-foreground">
              Modelo: {instance.model}
            </span>
            <span className="text-xs text-muted-foreground">
              Creado: {new Date(instance.created_at).toLocaleDateString("es-MX")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {!isSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive(instance.id)}
            >
              Activar
            </Button>
          )}
          <Button variant="secondary" size="sm">
            <Settings className="size-3.5" />
            Configurar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Canales
            </CardTitle>
            <Globe className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {instance.channels?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {instance.channels?.filter((c) => c.is_active).length ?? 0} activos
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Herramientas
            </CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {instance.tools?.length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {instance.tools?.filter((t) => t.is_enabled).length ?? 0} activas
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Webhook Token
            </CardTitle>
            <Key className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono truncate">
              {instance.webhook_token.slice(0, 8)}...
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Prompt
            </CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {instance.system_prompt?.slice(0, 80) || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canales</CardTitle>
          </CardHeader>
          <CardContent>
            {instance.channels?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin canales configurados.
              </p>
            ) : (
              <div className="space-y-3">
                {instance.channels?.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {ch.channel}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {ch.external_id?.slice(0, 30) || "sin external_id"}
                      </p>
                    </div>
                    <Badge
                      variant={ch.is_active ? "default" : "secondary"}
                    >
                      {ch.is_active ? "activo" : "inactivo"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Herramientas</CardTitle>
          </CardHeader>
          <CardContent>
            {instance.tools?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin herramientas configuradas.
              </p>
            ) : (
              <div className="space-y-3">
                {instance.tools?.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {tool.tool_type}
                      </p>
                      {tool.config && (
                        <p className="text-xs text-muted-foreground">
                          {JSON.stringify(tool.config).slice(0, 50)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={tool.is_enabled ? "default" : "secondary"}
                    >
                      {tool.is_enabled ? "activa" : "inactiva"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
