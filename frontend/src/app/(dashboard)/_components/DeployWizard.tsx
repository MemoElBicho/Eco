"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"

type Channel = { enabled: boolean; external_id: string }
type Step = 1 | 2 | 3

interface Template {
  id: string; slug: string; name: string; description: string | null
  default_channels: string[]; config_schema: Record<string, unknown> | null
}

interface Props { template: Template | null; open: boolean; onClose: () => void }

interface SchemaProperty { type?: string; default?: unknown; enum?: string[]; description?: string }

interface ConfigSchema { type: string; properties: Record<string, SchemaProperty>; required?: string[] }

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseSchema(schema: Record<string, unknown> | null): ConfigSchema | null {
  if (!schema) return null
  const s = schema as Record<string, unknown>
  if (s.type !== "object" || !s.properties) return null
  return s as unknown as ConfigSchema
}

export function DeployWizard({ template, open, onClose }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({})
  const [channels, setChannels] = useState<Record<string, Channel>>({})

  const schema = useMemo(() => parseSchema(template?.config_schema ?? null), [template])

  useEffect(() => {
    if (template) {
      setStep(1)
      const parsed = parseSchema(template.config_schema)
      const init: Record<string, unknown> = {}
      if (parsed) {
        for (const [key, prop] of Object.entries(parsed.properties)) {
          init[key] = prop.default ?? (prop.type === "boolean" ? false : "")
        }
      }
      setConfigValues(init)
      const chInit: Record<string, Channel> = {}
      for (const ch of template.default_channels) {
        chInit[ch] = { enabled: true, external_id: "" }
      }
      setChannels(chInit)
    }
  }, [template, open])

  if (!template) return null

  const toggleChannel = (ch: string, enabled: boolean) => setChannels((p) => ({ ...p, [ch]: { ...p[ch], enabled } }))
  const setExternalId = (ch: string, external_id: string) => setChannels((p) => ({ ...p, [ch]: { ...p[ch], external_id } }))

  const enabledChannels = Object.entries(channels).filter(([, v]) => v.enabled).map(([ch]) => ch)

  const handleSubmit = async () => {
    setSubmitting(true)
    const token = localStorage.getItem("token")
    const payload = {
      template_slug: template.slug,
      name: (configValues.bot_name as string) || template.name,
      config: configValues,
      channels: Object.entries(channels).filter(([, v]) => v.enabled).map(([ch, v]) => ({ channel: ch, external_id: v.external_id || undefined })),
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/operators/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(payload),
      })
      if (res.ok) onClose()
    } finally { setSubmitting(false) }
  }

  const isWhatsApp = template.default_channels.includes("whatsapp")
  const isTelegram = template.default_channels.includes("telegram")
  const schemaProperties = schema ? Object.entries(schema.properties) : []

  const renderConfigField = (key: string, prop: SchemaProperty) => {
    const id = `wiz-${key}`
    const value = configValues[key]
    const isRequired = schema?.required?.includes(key) ?? false
    const label = formatLabel(key)
    const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--t2)] outline-none focus:border-[var(--amber)] transition-colors"

    if (prop.enum && prop.enum.length > 0) {
      return (
        <div key={key} className="space-y-1.5">
          <label htmlFor={id} className="text-xs text-[var(--t2)]">{label}{isRequired && <span className="ml-0.5 text-[var(--red)]">*</span>}</label>
          <select id={id} className={`${inputClass} appearance-none`} value={String(value ?? "")} onChange={(e) => setConfigValues((p) => ({ ...p, [key]: e.target.value }))}>
            <option value="" disabled>{prop.description || `Seleccionar ${label.toLowerCase()}`}</option>
            {prop.enum.map((opt) => (<option key={opt} value={opt}>{formatLabel(opt)}</option>))}
          </select>
        </div>
      )
    }

    if (prop.type === "boolean") {
      return (
        <div key={key} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
          <input id={id} type="checkbox" className="accent-[var(--amber)]" checked={Boolean(value)} onChange={(e) => setConfigValues((p) => ({ ...p, [key]: e.target.checked }))} />
          <label htmlFor={id} className="text-sm text-[var(--foreground)] cursor-pointer">{label}{isRequired && <span className="ml-0.5 text-[var(--red)]">*</span>}</label>
        </div>
      )
    }

    return (
      <div key={key} className="space-y-1.5">
        <label htmlFor={id} className="text-xs text-[var(--t2)]">{label}{isRequired && <span className="ml-0.5 text-[var(--red)]">*</span>}</label>
        <input id={id} placeholder={prop.description || `Ej: ${label}`} value={String(value ?? "")} onChange={(e) => setConfigValues((p) => ({ ...p, [key]: e.target.value }))} className={inputClass} />
      </div>
    )
  }

  const formatValue = (val: unknown): string => {
    if (val === undefined || val === null || val === "" || val === false) return "—"
    if (typeof val === "boolean") return val ? "Si" : "No"
    return String(val)
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg2)] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">{step === 3 ? "Confirmar despliegue" : `Desplegar ${template.name}`}</h3>
                <p className="text-xs text-[var(--t2)] mt-0.5">
                  {step === 1 && "Configura los parámetros básicos del operador."}
                  {step === 2 && "Selecciona los canales de comunicación."}
                  {step === 3 && "Revisa la configuración y lanza la instancia."}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--t2)] hover:text-[var(--foreground)]"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex justify-center gap-2 mb-5">
              {([1, 2, 3] as Step[]).map((s) => (
                <div key={s} className={`h-2 w-2 rounded-full transition-colors ${s <= step ? "bg-[var(--amber)]" : "bg-[var(--border)]"}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {schemaProperties.length > 0 ? schemaProperties.map(([key, prop]) => renderConfigField(key, prop)) : (
                  <div className="py-6 text-center text-sm text-[var(--t2)]">Esta plantilla no requiere configuración adicional.</div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {isWhatsApp && (
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${channels.whatsapp?.enabled ? "border-[var(--amber)] bg-[var(--amber-dim)]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                    <input type="checkbox" className="mt-1 accent-[var(--amber)]" checked={channels.whatsapp?.enabled ?? true} onChange={(e) => toggleChannel("whatsapp", e.target.checked)} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">WhatsApp</span>
                      {channels.whatsapp?.enabled && (
                        <input placeholder='{"access_token":"...","phone_number_id":"..."}' value={channels.whatsapp?.external_id || ""} onChange={(e) => setExternalId("whatsapp", e.target.value)}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--t2)] outline-none focus:border-[var(--amber)]" />
                      )}
                    </div>
                  </label>
                )}
                {isTelegram && (
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${channels.telegram?.enabled ? "border-[var(--amber)] bg-[var(--amber-dim)]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
                    <input type="checkbox" className="mt-1 accent-[var(--amber)]" checked={channels.telegram?.enabled ?? true} onChange={(e) => toggleChannel("telegram", e.target.checked)} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Telegram</span>
                      {channels.telegram?.enabled && (
                        <input placeholder="Bot Token de Telegram" value={channels.telegram?.external_id || ""} onChange={(e) => setExternalId("telegram", e.target.value)}
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--t2)] outline-none focus:border-[var(--amber)]" />
                      )}
                    </div>
                  </label>
                )}
                {!isWhatsApp && !isTelegram && (
                  <div className="py-6 text-center text-sm text-[var(--t2)]">Esta plantilla no tiene canales configurables.</div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
                <div className="flex justify-between"><span className="text-[var(--t2)]">Plantilla</span><span className="font-medium text-[var(--foreground)]">{template.name}</span></div>
                {schemaProperties.map(([key]) => (
                  <div key={key} className="flex justify-between"><span className="text-[var(--t2)]">{formatLabel(key)}</span><span className="font-medium text-[var(--foreground)]">{formatValue(configValues[key])}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-[var(--t2)]">Canales</span><span className="font-medium text-[var(--foreground)]">{enabledChannels.length > 0 ? enabledChannels.join(", ") : "—"}</span></div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-5">
              {step > 1 ? (
                <button onClick={() => setStep((step - 1) as Step)} className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--t2)] hover:text-[var(--foreground)] transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
              ) : <div />}
              {step < 3 ? (
                <button onClick={() => setStep((step + 1) as Step)} className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-4 py-2 text-xs font-medium text-white">
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--green)] to-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Lanzar Instancia
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
