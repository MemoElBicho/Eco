"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Loader2, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { api, SubscriptionOut, WorkspaceConfig } from "@/lib/api"

const FIELDS: { key: keyof WorkspaceConfig; label: string; desc: string }[] = [
  { key: "openai_api_key", label: "OpenAI / Gemini API Key", desc: "Used for AI agent responses and embeddings." },
  { key: "telegram_bot_token", label: "Telegram Bot Token", desc: "From BotFather. Used to send and receive Telegram messages." },
  { key: "whatsapp_phone_number_id", label: "WhatsApp Phone Number ID", desc: "From Meta Business API dashboard." },
  { key: "whatsapp_access_token", label: "WhatsApp Access Token", desc: "Permanent token from Meta for sending messages." },
  { key: "whatsapp_verify_token", label: "WhatsApp Verify Token", desc: "Custom token to validate webhook handshake." },
]

const HUBSPOT_FIELDS: { key: keyof WorkspaceConfig; label: string; desc: string }[] = [
  { key: "hubspot_access_token", label: "HubSpot Access Token", desc: "Private app token from HubSpot with crm.objects.contacts scope." },
  { key: "hubspot_portal_id", label: "HubSpot Portal ID", desc: "Your HubSpot account ID (found in account settings)." },
]

export default function SettingsPage() {
  const [cfg, setCfg] = useState<WorkspaceConfig | null>(null)
  const [form, setForm] = useState<Partial<WorkspaceConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sub, setSub] = useState<SubscriptionOut | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.settings.get().then((c) => { setCfg(c); setForm(c) }),
      api.billing.get().then(setSub),
    ])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.settings.update(form)
      setCfg(updated)
      setForm(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    finally { setSaving(false) }
  }, [form])

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await api.billing.portal()
      window.location.href = res.url
    } catch {
      setPortalLoading(false)
    }
  }

  const updateField = (key: keyof WorkspaceConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value || null }))
  }

  const formatDate = (d: string | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Settings</CardTitle>
          <CardDescription>Configure API keys and tokens for your workspace. These are stored securely and isolated to your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-28" />
              {HUBSPOT_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium">{f.label}</label>
                  <p className="mb-1.5 text-xs text-muted-foreground">{f.desc}</p>
                  <Input
                    type="password"
                    placeholder="Paste your key..."
                    value={(form[f.key] as string) ?? ""}
                    onChange={(e) => updateField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <Separator />
              <h3 className="text-sm font-semibold">Integración con HubSpot</h3>
              {HUBSPOT_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium">{f.label}</label>
                  <p className="mb-1.5 text-xs text-muted-foreground">{f.desc}</p>
                  <Input
                    type="password"
                    placeholder="Paste your key..."
                    value={(form[f.key] as string) ?? ""}
                    onChange={(e) => updateField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save /> {saving ? "Saving..." : "Guardar Configuración de HubSpot"}
                </Button>
                {saved && <span className="text-sm text-green-600">Configuration saved.</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facturación</CardTitle>
          <CardDescription>Gestiona tu plan de suscripción y método de pago.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-9 w-48" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plan</span>
                  <p className="font-medium capitalize">{sub?.plan || "free"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado</span>
                  <p>
                    <Badge variant={sub?.status === "active" ? "default" : "destructive"}>
                      {sub?.status || "active"}
                    </Badge>
                  </p>
                </div>
                {sub?.current_period_end && (
                  <div>
                    <span className="text-muted-foreground">Renovación</span>
                    <p className="font-medium">{formatDate(sub.current_period_end)}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex gap-3">
                <Button onClick={handlePortal} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  {portalLoading ? "Redirigiendo..." : "Administrar Suscripción"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
