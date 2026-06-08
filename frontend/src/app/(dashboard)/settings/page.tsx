"use client"

import { useCallback, useEffect, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api, WorkspaceConfig } from "@/lib/api"

const FIELDS: { key: keyof WorkspaceConfig; label: string; desc: string }[] = [
  { key: "openai_api_key", label: "OpenAI / Gemini API Key", desc: "Used for AI agent responses and embeddings." },
  { key: "telegram_bot_token", label: "Telegram Bot Token", desc: "From BotFather. Used to send and receive Telegram messages." },
  { key: "whatsapp_phone_number_id", label: "WhatsApp Phone Number ID", desc: "From Meta Business API dashboard." },
  { key: "whatsapp_access_token", label: "WhatsApp Access Token", desc: "Permanent token from Meta for sending messages." },
  { key: "whatsapp_verify_token", label: "WhatsApp Verify Token", desc: "Custom token to validate webhook handshake." },
]

export default function SettingsPage() {
  const [cfg, setCfg] = useState<WorkspaceConfig | null>(null)
  const [form, setForm] = useState<Partial<WorkspaceConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.settings.get()
      .then((c) => { setCfg(c); setForm(c) })
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

  const updateField = (key: keyof WorkspaceConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value || null }))
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
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save /> {saving ? "Saving..." : "Save Configuration"}
                </Button>
                {saved && <span className="text-sm text-green-600">Configuration saved.</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
