"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Channel = { enabled: boolean; external_id: string }
type Step = 1 | 2 | 3

interface Template {
  id: string
  slug: string
  name: string
  description: string | null
  default_channels: string[]
  config_schema: Record<string, unknown> | null
}

interface Props {
  template: Template | null
  open: boolean
  onClose: () => void
}

interface SchemaProperty {
  type?: string
  default?: unknown
  enum?: string[]
  description?: string
}

interface ConfigSchema {
  type: string
  properties: Record<string, SchemaProperty>
  required?: string[]
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL no esta definida. Debe configurarse en el entorno de build."
  )
}
const BASE = process.env.NEXT_PUBLIC_API_URL

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseSchema(
  schema: Record<string, unknown> | null
): ConfigSchema | null {
  if (!schema) return null
  const s = schema as Record<string, unknown>
  if (s.type !== "object" || !s.properties) return null
  return s as unknown as ConfigSchema
}

function selectClasses(): string {
  return [
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1",
    "text-base transition-colors outline-none appearance-none",
    "placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  ].join(" ")
}

export function DeployWizard({ template, open, onClose }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({})
  const [channels, setChannels] = useState<Record<string, Channel>>({})

  const schema = useMemo(
    () => parseSchema(template?.config_schema ?? null),
    [template]
  )

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

  const toggleChannel = (ch: string, enabled: boolean) => {
    setChannels((prev) => ({
      ...prev,
      [ch]: { ...prev[ch], enabled },
    }))
  }

  const setExternalId = (ch: string, external_id: string) => {
    setChannels((prev) => ({
      ...prev,
      [ch]: { ...prev[ch], external_id },
    }))
  }

  const enabledChannels = Object.entries(channels)
    .filter(([, v]) => v.enabled)
    .map(([ch]) => ch)

  const handleSubmit = async () => {
    setSubmitting(true)
    const token = localStorage.getItem("token")
    const payload = {
      template_slug: template.slug,
      name: (configValues.bot_name as string) || template.name,
      config: configValues,
      channels: Object.entries(channels)
        .filter(([, v]) => v.enabled)
        .map(([ch, v]) => ({
          channel: ch,
          external_id: v.external_id || undefined,
        })),
    }
    try {
      const res = await fetch(`${BASE}/operators/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onClose()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isWhatsApp = template.default_channels.includes("whatsapp")
  const isTelegram = template.default_channels.includes("telegram")

  const schemaProperties = schema ? Object.entries(schema.properties) : []

  const renderConfigField = (key: string, prop: SchemaProperty) => {
    const id = `wiz-${key}`
    const value = configValues[key]
    const isRequired = schema?.required?.includes(key) ?? false
    const label = formatLabel(key)

    if (prop.enum && prop.enum.length > 0) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={id}>
            {label}
            {isRequired && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
          <select
            id={id}
            className={selectClasses()}
            value={String(value ?? "")}
            onChange={(e) =>
              setConfigValues((prev) => ({ ...prev, [key]: e.target.value }))
            }
          >
            <option value="" disabled>
              {prop.description || `Seleccionar ${label.toLowerCase()}`}
            </option>
            {prop.enum.map((opt) => (
              <option key={opt} value={opt}>
                {formatLabel(opt)}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (prop.type === "boolean") {
      return (
        <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
          <input
            id={id}
            type="checkbox"
            className="size-4 accent-primary"
            checked={Boolean(value)}
            onChange={(e) =>
              setConfigValues((prev) => ({ ...prev, [key]: e.target.checked }))
            }
          />
          <Label htmlFor={id} className="cursor-pointer text-sm">
            {label}
            {isRequired && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        </div>
      )
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {isRequired && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        <Input
          id={id}
          placeholder={prop.description || `Ej: ${label}`}
          value={String(value ?? "")}
          onChange={(e) =>
            setConfigValues((prev) => ({ ...prev, [key]: e.target.value }))
          }
        />
      </div>
    )
  }

  const formatValue = (val: unknown): string => {
    if (val === undefined || val === null || val === "" || val === false)
      return "—"
    if (typeof val === "boolean") return val ? "Si" : "No"
    return String(val)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 3
              ? "Confirmar despliegue"
              : `Desplegar ${template.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Configura los parametros basicos del operador."}
            {step === 2 && "Selecciona los canales de comunicacion."}
            {step === 3 &&
              "Revisa la configuracion y lanza la instancia."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`size-2 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {schemaProperties.length > 0 ? (
              schemaProperties.map(([key, prop]) =>
                renderConfigField(key, prop)
              )
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Esta plantilla no requiere configuracion adicional.
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {isWhatsApp && (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  channels.whatsapp?.enabled
                    ? "border-primary/50 bg-accent/30"
                    : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-primary"
                  checked={channels.whatsapp?.enabled ?? true}
                  onChange={(e) =>
                    toggleChannel("whatsapp", e.target.checked)
                  }
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <span className="text-sm font-medium">WhatsApp</span>
                  {channels.whatsapp?.enabled && (
                    <Input
                      placeholder='{"access_token":"...","phone_number_id":"..."}'
                      value={channels.whatsapp?.external_id || ""}
                      onChange={(e) =>
                        setExternalId("whatsapp", e.target.value)
                      }
                    />
                  )}
                </div>
              </label>
            )}
            {isTelegram && (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  channels.telegram?.enabled
                    ? "border-primary/50 bg-accent/30"
                    : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-primary"
                  checked={channels.telegram?.enabled ?? true}
                  onChange={(e) =>
                    toggleChannel("telegram", e.target.checked)
                  }
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <span className="text-sm font-medium">Telegram</span>
                  {channels.telegram?.enabled && (
                    <Input
                      placeholder="Bot Token de Telegram"
                      value={channels.telegram?.external_id || ""}
                      onChange={(e) =>
                        setExternalId("telegram", e.target.value)
                      }
                    />
                  )}
                </div>
              </label>
            )}
            {!isWhatsApp && !isTelegram && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Esta plantilla no tiene canales configurables.
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plantilla</span>
              <Badge variant="secondary">{template.name}</Badge>
            </div>
            {schemaProperties.map(([key]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">
                  {formatLabel(key)}
                </span>
                <span className="font-medium">
                  {formatValue(configValues[key])}
                </span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canales</span>
              <span className="font-medium">
                {enabledChannels.length > 0
                  ? enabledChannels.join(", ")
                  : "—"}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((step - 1) as Step)}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button onClick={() => setStep((step + 1) as Step)}>
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Lanzar Instancia
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
