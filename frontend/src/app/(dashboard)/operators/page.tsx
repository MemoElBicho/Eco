"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Bot,
  ExternalLink,
  MoreVertical,
  Play,
  Pause,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { api, OperatorInstanceOut } from "@/lib/api"
import { useActiveInstance } from "@/hooks/use-active-instance"

const STATUS_CLASS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  deleted: "bg-red-100 text-red-700",
  deploying: "bg-blue-100 text-blue-700",
}

export default function OperatorsPage() {
  const [instances, setInstances] = useState<OperatorInstanceOut[]>([])
  const [loading, setLoading] = useState(true)
  const { instanceId, setActive } = useActiveInstance()

  useEffect(() => {
    api.operators.list()
      .then(setInstances)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    await api.operators.delete(id)
    setInstances((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "deleted" } : i)),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Mis Bots
          </h2>
          <p className="text-muted-foreground">
            Instancias de operadores desplegadas.
          </p>
        </div>
        <Button render={<Link href="/catalog" />}>
          <Bot className="size-4" />
          Nuevo Bot
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Bot className="size-12 opacity-20" />
          <p className="text-sm font-medium">No tienes bots aún.</p>
          <Button render={<Link href="/catalog" />} variant="outline" size="sm">
            Ir al catálogo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((inst) => {
            const isActive = inst.id === instanceId
            return (
              <Card
                key={inst.id}
                className={`relative flex flex-col transition-shadow hover:shadow-md ${
                  isActive ? "ring-2 ring-primary/30" : ""
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-medium text-primary-foreground">
                    Activo
                  </span>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {inst.name}
                      </CardTitle>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[inst.status] ?? STATUS_CLASS.active}`}
                      >
                        {inst.status}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon-xs">
                          <MoreVertical className="size-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setActive(inst.id)}>
                          <Play className="size-3.5" />
                          Activar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(inst.id)}>
                          <Trash2 className="size-3.5" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {inst.channels?.map((ch) => (
                      <Badge
                        key={ch.id}
                        variant={ch.is_active ? "default" : "outline"}
                        className="text-xs"
                      >
                        {ch.channel}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {inst.tools?.map((t) => (
                      <Badge
                        key={t.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {t.tool_type}
                      </Badge>
                    ))}
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setActive(inst.id)}
                    >
                      <ExternalLink className="size-3.5" />
                      {isActive ? "Seleccionado" : "Seleccionar"}
                    </Button>
                    <Button render={<Link href={`/operators/${inst.id}`} />} variant="default" size="sm" className="flex-1">
                      Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
