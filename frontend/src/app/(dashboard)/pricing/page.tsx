"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Sparkles } from "lucide-react"
import { api, SubscriptionOut } from "@/lib/api"

const PLANS = [
  { id: "free", name: "Free", price: "$0", period: "para siempre",
    features: ["50 mensajes por mes", "1 documento en Brain", "5 leads en CRM"], cta: null },
  { id: "pro", name: "Pro", price: "$29", period: "por mes",
    features: ["Mensajes ilimitados", "Documentos ilimitados", "Leads ilimitados", "Soporte prioritario"], cta: "Obtener Pro" },
  { id: "enterprise", name: "Enterprise", price: "$99", period: "por mes",
    features: ["Todo lo de Pro", "Webhooks personalizados", "SLA garantizado", "Onboarding dedicado"], cta: "Obtener Enterprise" },
]

export default function PricingPage() {
  const [sub, setSub] = useState<SubscriptionOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<string | null>(null)

  useEffect(() => {
    api.billing.get().then(setSub).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (planId: string) => {
    setChecking(planId)
    try { const res = await api.billing.checkout(); window.location.href = res.url } catch { setChecking(null) }
  }

  const currentPlan = sub?.plan || "free"

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Planes y Precios</h2>
        <p className="text-sm text-[var(--t2)]">
          Elige el plan que mejor se adapte a tu negocio.
          {currentPlan !== "free" && (
            <button onClick={async () => { const res = await api.billing.portal(); window.location.href = res.url }}
              className="ml-2 underline hover:no-underline text-[var(--amber)]">Gestionar suscripción</button>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? PLANS.map((p) => (
          <div key={p.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="h-5 w-20 bg-[var(--bg)] rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-[var(--bg)] rounded animate-pulse mb-4" />
            {[1, 2, 3].map((i) => (<div key={i} className="h-4 w-full bg-[var(--bg)] rounded animate-pulse mb-2" />))}
          </div>
        )) : PLANS.map((p) => {
          const isCurrent = currentPlan === p.id
          return (
            <div key={p.id} className={`relative rounded-lg border bg-[var(--surface)] p-5 flex flex-col gap-4 ${
              isCurrent ? "border-[var(--amber)]" : "border-[var(--border)]"
            }`}>
              {isCurrent && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[rgba(245,158,11,0.08)] to-transparent pointer-events-none" />
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--foreground)]">{p.name}</h3>
                {isCurrent && <Sparkles className="h-4 w-4 text-[var(--amber)]" />}
              </div>
              <div>
                <span className="text-3xl font-bold text-[var(--foreground)]">{p.price}</span>
                <span className="text-sm text-[var(--t2)]"> / {p.period}</span>
              </div>
              {isCurrent && <span className="text-[10px] rounded-full bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)] px-2 py-0.5 self-start">Plan Actual</span>}
              <ul className="space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[var(--foreground)]">
                    <Check className="mt-0.5 h-4 w-4 text-[var(--green)] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {p.cta ? (
                <button onClick={() => handleUpgrade(p.id)} disabled={isCurrent || checking === p.id}
                  className={`w-full rounded-full py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                    isCurrent
                      ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--t2)]"
                      : "bg-gradient-to-br from-[var(--amber)] to-orange-600 text-white hover:opacity-90"
                  }`}>
                  {checking === p.id ? <><Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> Redirigiendo...</> : isCurrent ? "Plan Actual" : p.cta}
                </button>
              ) : (
                <button disabled className="w-full rounded-full bg-[var(--surface)] border border-[var(--border)] py-2 text-xs font-medium text-[var(--t2)]">
                  Plan Actual
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
