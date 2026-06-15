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
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"

type Operator = { id: string; name: string; status: string }

const STORAGE_KEY = "eco_active_instance"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalog", label: "Catálogo", icon: Store },
  { href: "/operators", label: "Mis Bots", icon: Bot },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/brain", label: "Brain", icon: Brain },
  { href: "/settings", label: "Configuración", icon: Settings },
]

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL no esta definida. Debe configurarse en el entorno de build."
  )
}
const BASE = process.env.NEXT_PUBLIC_API_URL

async function fetchOperators(): Promise<Operator[]> {
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
    <SidebarRoot collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-1 px-4 pt-4 pb-2">
          <span className="text-lg font-semibold tracking-tight">Echo</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <span className="truncate max-w-[140px]">
                {active?.name || "Sin instancia"}
              </span>
              <ChevronDown className="ml-auto size-3 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {instances.map((inst) => (
                <DropdownMenuItem
                  key={inst.id}
                  onSelect={() => handleSelect(inst.id)}
                  className={
                    inst.id === activeId ? "font-medium bg-muted/50" : ""
                  }
                >
                  <span className="truncate">{inst.name}</span>
                  {inst.status !== "active" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {inst.status}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              {instances.length === 0 && (
                <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                  Sin instancias activas
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={pathname === href}
                    tooltip={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-1 p-4">
        {user && (
          <span className="text-xs text-muted-foreground truncate">
            {user.name}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60">
          Echo v0.1.0
        </span>
      </SidebarFooter>
    </SidebarRoot>
  )
}
