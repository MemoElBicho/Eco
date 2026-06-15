"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, ConversationOut, LeadOut } from "@/lib/api"

const STATUS_MAP: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  qualified: "outline",
  negotiation: "secondary",
  closed_won: "default",
  closed_lost: "destructive",
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: "bg-green-500",
  negative: "bg-red-500",
  neutral: "bg-yellow-500",
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadOut[]>([])
  const [convs, setConvs] = useState<ConversationOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.leads.list(), api.conversations.list()])
      .then(([l, c]) => {
        setLeads(l)
        setConvs(c)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalLeads = leads.length
  const activeChats = convs.filter((c) => c.bot_active).length
  const avgSentiment =
    leads.length > 0
      ? (
          leads.reduce((s, l) => s + (l.sentiment ?? 0), 0) / leads.length
        ).toFixed(2)
      : "0.00"
  const totalMessages = convs.reduce((s, c) => s + c.message_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Métricas de tu operador activo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "—" : totalLeads}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chats Activos
            </CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "—" : activeChats}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sentimiento Promedio
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-bold">
              {loading ? "—" : avgSentiment}
            </p>
            <span
              className={`text-xs font-medium ${
                Number(avgSentiment) > 0.1
                  ? "text-green-600"
                  : Number(avgSentiment) < -0.1
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              {Number(avgSentiment) > 0.1
                ? "↑ positivo"
                : Number(avgSentiment) < -0.1
                  ? "↓ negativo"
                  : "→ neutro"}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Mensajes
            </CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "—" : totalMessages}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay leads registrados aún.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sentimiento</TableHead>
                  <TableHead className="text-right">
                    Última actividad
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 8).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {l.name || "—"}
                    </TableCell>
                    <TableCell className="text-xs font-mono capitalize">
                      {l.channel}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_MAP[l.status] ?? "default"
                        }
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`inline-block size-2 rounded-full ${SENTIMENT_DOT[l.sentiment_label] ?? "bg-yellow-500"}`}
                        />
                        {(l.sentiment ?? 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(l.updated_at).toLocaleDateString(
                        "es-MX",
                        { day: "numeric", month: "short" },
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
