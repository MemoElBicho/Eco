"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Loader2, Save, Check } from "lucide-react"
import { api, SubscriptionOut, WorkspaceConfig } from "@/lib/api"

const FIELDS: { key: keyof WorkspaceConfig; label: string; desc: string }[] = [
  { key: "openai_api_key", label: "OpenAI / Gemini API Key", desc: "Usada para respuestas del AI y embeddings." },
  { key: "telegram_bot_token", label: "Telegram Bot Token", desc: "De BotFather. Usado para enviar y recibir mensajes de Telegram." },
  { key: "whatsapp_phone_number_id", label: "WhatsApp Phone Number ID", desc: "Del panel de Meta Business API." },
  { key: "whatsapp_access_token", label: "WhatsApp Access Token", desc: "Token permanente de Meta para enviar mensajes." },
  { key: "whatsapp_verify_token", label: "WhatsApp Verify Token", desc: "Token personalizado para validar el webhook." },
]

const HUBSPOT_FIELDS: { key: keyof WorkspaceConfig; label: string; desc: string }[] = [
  { key: "hubspot_access_token", label: "HubSpot Access Token", desc: "Token de app privada con scope crm.objects.contacts." },
  { key: "hubspot_portal_id", label: "HubSpot Portal ID", desc: "ID de tu cuenta de HubSpot." },
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
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true); setSaved(false)
    try {
      const updated = await api.settings.update(form)
      setCfg(updated); setForm(updated); setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally { setSaving(false) }
  }, [form])

  const handlePortal = async () => {
    setPortalLoading(true)
    try { const res = await api.billing.portal(); window.location.href = res.url } catch {} finally { setPortalLoading(false) }
  }

  const updateField = (key: keyof WorkspaceConfig, value: string) => setForm((prev) => ({ ...prev, [key]: value || null }))
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : null

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--t2)] outline-none focus:border-[var(--amber)] transition-colors"

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Workspace Settings</h3>
        <p className="text-xs text-[var(--t2)] mt-0.5 mb-4">Configura las API keys y tokens para tu workspace.</p>
        {loading ? (
          <div className="space-y-4">
            {[...FIELDS, ...HUBSPOT_FIELDS].map((f) => (
              <div key={f.key} className="space-y-1"><div className="h-4 w-44 bg-[var(--bg)] rounded animate-pulse" /><div className="h-8 w-full bg-[var(--bg)] rounded animate-pulse" /></div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-[var(--t2)] mb-1 block">{f.label}</label>
                  <p className="text-[10px] text-[var(--t2)]/70 mb-1.5">{f.desc}</p>
                  <input type="password" placeholder="Pega tu key..." value={(form[f.key] as string) ?? ""} onChange={(e) => updateField(f.key, e.target.value)} className={inputClass} />
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Integración con HubSpot</h4>
              {HUBSPOT_FIELDS.map((f) => (
                <div key={f.key} className="mb-4">
                  <label className="text-xs text-[var(--t2)] mb-1 block">{f.label}</label>
                  <p className="text-[10px] text-[var(--t2)]/70 mb-1.5">{f.desc}</p>
                  <input type="password" placeholder="Pega tu key..." value={(form[f.key] as string) ?? ""} onChange={(e) => updateField(f.key, e.target.value)} className={inputClass} />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? "Guardando..." : "Guardar Configuración"}
                </button>
                {saved && <span className="text-xs text-[var(--green)] flex items-center gap-1"><Check className="h-3 w-3" /> Guardado.</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Facturación</h3>
        <p className="text-xs text-[var(--t2)] mt-0.5 mb-4">Gestiona tu plan de suscripción.</p>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-32 bg-[var(--bg)] rounded animate-pulse" />
            <div className="h-4 w-48 bg-[var(--bg)] rounded animate-pulse" />
            <div className="h-9 w-48 bg-[var(--bg)] rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-xs text-[var(--t2)]">Plan</span><p className="text-sm font-medium text-[var(--foreground)] capitalize">{sub?.plan || "free"}</p></div>
              <div>
                <span className="text-xs text-[var(--t2)]">Estado</span>
                <p><span className={`text-[10px] rounded-full px-2 py-0.5 border font-medium ${sub?.status === "active" ? "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border-[rgba(16,185,129,0.3)]" : "bg-[rgba(239,68,68,0.15)] text-[var(--red)] border-[rgba(239,68,68,0.3)]"}`}>{sub?.status || "active"}</span></p>
              </div>
              {sub?.current_period_end && (
                <div><span className="text-xs text-[var(--t2)]">Renovación</span><p className="text-sm font-medium text-[var(--foreground)]">{formatDate(sub.current_period_end)}</p></div>
              )}
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <button onClick={handlePortal} disabled={portalLoading} className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--t2)] hover:text-[var(--foreground)] disabled:opacity-50">
                {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                {portalLoading ? "Redirigiendo..." : "Administrar Suscripción"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
