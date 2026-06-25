"use client"

import { usePathname } from "next/navigation"
import { Calendar, Bell, User, Search, ChevronDown } from "lucide-react"

import { Sidebar } from "./_components/sidebar"

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/catalog": "Catálogo",
  "/operators": "Mis Bots",
  "/leads": "Leads",
  "/conversations": "Conversaciones",
  "/brain": "Brain",
  "/settings": "Configuración",
  "/pricing": "Planes",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="main flex-1 flex flex-col h-full overflow-hidden">
        <header className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--bg2)] px-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              {TITLES[pathname] || "Dashboard"}
            </h1>
            <p className="text-sm text-[var(--t2)] capitalize mt-0.5">
              {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2">
              <Calendar className="h-4 w-4 text-[var(--t2)]" />
              <span className="text-sm text-[var(--foreground)]">Hoy</span>
              <ChevronDown className="h-4 w-4 text-[var(--t2)]" />
            </div>
            <button className="p-2 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
              <Search className="h-4 w-4 text-[var(--t2)]" />
            </button>
            <div className="relative">
              <button className="p-2 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors">
                <Bell className="h-4 w-4 text-[var(--t2)]" />
              </button>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[var(--red)]"></div>
            </div>
            <button className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </button>
          </div>
        </header>
        <div className="alert-strip flex gap-3 px-6 py-3 bg-[var(--bg)] border-b border-[var(--border)] overflow-x-auto">
          <div className="flex items-center gap-2 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--red)] flex-shrink-0"></div>
            <span className="text-xs text-[var(--red)] whitespace-nowrap">Error en webhook</span>
            <button className="text-[var(--red)] hover:text-[var(--red)]/80 font-medium text-xs ml-1">
              Descartar
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--amber)] flex-shrink-0"></div>
            <span className="text-xs text-[var(--amber)] whitespace-nowrap">Limite de almacenamiento alcanzado</span>
            <button className="text-[var(--amber)] hover:text-[var(--amber)]/80 font-medium text-xs ml-1">
              Descartar
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--green)] flex-shrink-0"></div>
            <span className="text-xs text-[var(--green)] whitespace-nowrap">Sistema de respaldo activo</span>
            <button className="text-[var(--green)] hover:text-[var(--green)]/80 font-medium text-xs ml-1">
              Descartar
            </button>
          </div>
        </div>
        <div className="content-area flex-1 overflow-y-auto p-[20px_24px]">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
