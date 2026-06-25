"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Brain,
  MessageSquare,
  Users,
  Settings,
  Store,
  Bot,
  ChevronDown,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"

type Operator = { id: string; name: string; status: string }

const STORAGE_KEY = "eco_active_instance"

const NAV_GROUPS = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: null },
      { href: "/conversations", label: "Conversaciones", icon: MessageSquare, badge: 12 },
      { href: "/leads", label: "Leads", icon: Users, badge: 45 },
    ],
  },
  {
    title: "IA & Datos",
    items: [
      { href: "/brain", label: "Brain/RAG", icon: Brain, badge: null },
      { href: "/catalog", label: "Análisis Sentimiento", icon: Store, badge: 5 },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/operators", label: "Integraciones", icon: Bot, badge: null },
      { href: "/settings", label: "Configuración", icon: Settings, badge: null },
    ],
  },
]

async function fetchOperators(): Promise<Operator[]> {
  const BASE = process.env.NEXT_PUBLIC_API_URL
  if (!BASE) return []
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (!token) return []
  try {
    const res = await fetch(`${BASE}/operators/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [instances, setInstances] = useState<Operator[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setActiveId(stored)
  }, [])

  useEffect(() => {
    if (!user) return
    fetchOperators().then((data) => {
      setInstances(data)
      if (!activeId && data.length > 0) {
        setActiveId(data[0].id)
        localStorage.setItem(STORAGE_KEY, data[0].id)
      }
    })
  }, [user])

  const handleSelect = (id: string) => {
    setActiveId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const active = instances.find((i) => i.id === activeId)

  return (
    <aside className="w-[220px] bg-[var(--bg2)] border-r border-[var(--border)] h-full flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-lg font-semibold text-[var(--foreground)]">ECHO</span>
        </div>
        <div className="text-[10px] text-[var(--t2)]">BI Dashboard</div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--t2)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] transition-colors">
            <span className="truncate max-w-[140px]">
              {active?.name || "Sin instancia"}
            </span>
            <ChevronDown className="ml-auto size-3 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-[var(--bg2)] border-[var(--border)]">
            {instances.map((inst) => (
              <DropdownMenuItem
                key={inst.id}
                onSelect={() => handleSelect(inst.id)}
                className={
                  inst.id === activeId
                    ? "font-medium bg-[var(--surface)] text-[var(--foreground)]"
                    : "text-[var(--foreground)]"
                }
              >
                <span className="truncate">{inst.name}</span>
                {inst.status !== "active" && (
                  <span className="ml-auto text-xs text-[var(--t2)]">
                    {inst.status}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            {instances.length === 0 && (
              <div className="px-2 py-3 text-sm text-[var(--t2)] text-center">
                Sin instancias activas
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.title} className="mb-4">
            {groupIndex > 0 && (
              <div className="text-[10px] uppercase tracking-wider text-[var(--t2)] mb-2 px-3">
                {group.title}
              </div>
            )}
            <nav className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive
                        ? "bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(245,158,11,0.2)]"
                        : "text-[var(--t2)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{label}</span>
                    {badge && (
                      <span className="bg-[var(--red)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-xs font-medium text-[var(--green)]">Bot Activo</span>
          <span className="text-[10px] text-[var(--t2)] ml-auto">Live: 7</span>
        </div>
        {user && (
          <div className="mt-2 text-xs text-[var(--t2)] truncate">
            {user.name}
          </div>
        )}
        <div className="text-[10px] text-[var(--t2)]/60 mt-1">Echo v0.2.0</div>
      </div>
    </aside>
  )
}
