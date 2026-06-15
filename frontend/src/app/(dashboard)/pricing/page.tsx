"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api, SubscriptionOut } from "@/lib/api"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "para siempre",
    features: ["50 mensajes por mes", "1 documento en Brain", "5 leads en CRM"],
    current: "Plan Actual",
    cta: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "por mes",
    features: ["Mensajes ilimitados", "Documentos ilimitados", "Leads ilimitados", "Soporte prioritario"],
    current: null,
    cta: "Obtener Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "por mes",
    features: ["Todo lo de Pro", "Webhooks personalizados", "SLA garantizado", "Onboarding dedicado"],
    current: null,
    cta: "Obtener Enterprise",
  },
]

export default function PricingPage() {
  const [sub, setSub] = useState<SubscriptionOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState<string | null>(null)

  useEffect(() => {
    api.billing.get()
      .then(setSub)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (planId: string) => {
    setChecking(planId)
    try {
      const res = await api.billing.checkout()
      window.location.href = res.url
    } catch {
      setChecking(null)
    }
  }

  const currentPlan = sub?.plan || "free"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Planes y Precios</h1>
          <p className="text-sm text-muted-foreground">
            Elige el plan que mejor se adapte a tu negocio.
            {currentPlan !== "free" && (
              <button
                onClick={async () => {
                  const res = await api.billing.portal()
                  window.location.href = res.url
                }}
                className="ml-2 underline hover:no-underline"
              >
                Gestionar suscripción
              </button>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {loading
          ? PLANS.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))
          : PLANS.map((p) => {
              const isCurrent = currentPlan === p.id
              return (
                <Card key={p.id} className={isCurrent ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <div>
                      <span className="text-3xl font-bold">{p.price}</span>
                      <span className="text-sm text-muted-foreground"> {p.period}</span>
                    </div>
                    <CardDescription>
                      {isCurrent ? p.current : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {p.cta ? (
                      <Button
                        className="w-full"
                        disabled={isCurrent || checking === p.id}
                        onClick={() => handleUpgrade(p.id)}
                      >
                        {checking === p.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirigiendo...
                          </>
                        ) : isCurrent ? (
                          "Plan Actual"
                        ) : (
                          p.cta
                        )}
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        {isCurrent ? "Plan Actual" : "Gratis"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
