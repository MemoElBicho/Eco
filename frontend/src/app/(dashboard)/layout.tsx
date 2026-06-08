"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Brain, MessageSquare, Users, Settings } from "lucide-react"

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader,
  SidebarTrigger, SidebarInset, SidebarFooter, SidebarProvider,
} from "@/components/ui/sidebar"

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/brain", label: "Eco Brain", icon: Brain },
  { href: "/conversations", label: "Live Chat Hub", icon: MessageSquare },
  { href: "/leads", label: "CRM Leads", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex items-center gap-2 p-4 text-lg font-semibold tracking-tight">
          Eco
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton render={<Link href={href} />} isActive={path === href} tooltip={label}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-muted-foreground">Eco v0.1.0</SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b px-6">
          <SidebarTrigger />
          <span className="font-medium">{NAV.find((n) => n.href === path)?.label || "Dashboard"}</span>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
