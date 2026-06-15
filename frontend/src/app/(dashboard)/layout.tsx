"use client"

import { usePathname } from "next/navigation"

import { Sidebar } from "./_components/sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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

  return (
    <SidebarProvider defaultOpen>
      <Sidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-6">
          <SidebarTrigger />
          <span className="font-medium">
            {TITLES[pathname] || "Dashboard"}
          </span>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
