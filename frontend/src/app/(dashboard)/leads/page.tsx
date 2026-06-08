"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useLeads } from "@/hooks/use-leads"

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive" | "ghost" | "link"> = {
  new: "default",
  contacted: "secondary",
  qualified: "outline",
  lost: "destructive",
}

function CreateLeadDialog({ onCreate }: { onCreate: (data: { name: string; channel: string; channel_user_id: string }) => Promise<unknown> }) {
  const [name, setName] = useState("")
  const [channel, setChannel] = useState("whatsapp")
  const [channelUserId, setChannelUserId] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = async () => {
    await onCreate({ name, channel, channel_user_id: channelUserId })
    setName("")
    setChannel("whatsapp")
    setChannelUserId("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="default" size="sm"><Plus /> Add Lead</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Channel User ID</label>
            <Input value={channelUserId} onChange={(e) => setChannelUserId(e.target.value)} placeholder="123456789" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSubmit} disabled={!name || !channelUserId}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function LeadsPage() {
  const { leads, loading, remove, create } = useLeads()
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () => leads.filter((l) => (l.name ?? "").toLowerCase().includes(search.toLowerCase()) || (l.phone ?? "").includes(search)),
    [leads, search]
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">CRM Leads</CardTitle>
            <CreateLeadDialog onCreate={create} />
          </div>
          <div className="relative mt-2">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {search ? "No leads match your search." : "No leads yet. Create your first lead above."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{l.phone || "—"}</TableCell>
                    <TableCell className="capitalize">{l.channel}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[l.status] ?? "default"}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" onClick={() => remove(l.id)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
