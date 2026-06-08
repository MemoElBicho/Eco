"use client"

import { useCallback, useRef, useState } from "react"
import { FileText, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBrain } from "@/hooks/use-brain"

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".txt"))) {
        setSelected(file)
      }
    },
    []
  )

  const handleFile = useCallback(
    () => {
      if (selected) {
        onFile(selected)
        setSelected(null)
      }
    },
    [selected, onFile]
  )

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : selected
              ? "border-success bg-success/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) setSelected(f)
          }}
        />
        {selected ? (
          <>
            <FileText className="size-8 text-primary" />
            <p className="text-sm font-medium">{selected.name}</p>
            <p className="text-xs text-muted-foreground">{(selected.size / 1024).toFixed(1)} KB</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleFile() }}>
                <Upload /> Upload
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(null) }}>
                <X /> Discard
              </Button>
            </div>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop PDF or TXT here</p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function BrainPage() {
  const { docs, loading, upload } = useBrain()
  const [uploading, setUploading] = useState(false)

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        await upload(file)
      } finally {
        setUploading(false)
      }
    },
    [upload]
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <DropZone onFile={handleUpload} />
          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Processing...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Knowledge Base ({docs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No documents uploaded yet. Drop a file above to start building your knowledge base.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.filename}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.chunk_count} chunk{d.chunk_count !== 1 ? "s" : ""} &middot;{" "}
                      {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
