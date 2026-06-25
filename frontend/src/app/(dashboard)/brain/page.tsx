"use client"

import { useCallback, useRef, useState } from "react"
import { FileText, Upload, X, Check } from "lucide-react"
import { useBrain } from "@/hooks/use-brain"

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".txt"))) {
      setSelected(file)
    }
  }, [])

  const handleFile = useCallback(() => {
    if (selected) { onFile(selected); setSelected(null) }
  }, [selected, onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragging
          ? "border-[var(--amber)] bg-[rgba(245,158,11,0.08)]"
          : selected
            ? "border-[var(--green)] bg-[rgba(16,185,129,0.08)]"
            : "border-[var(--border)] hover:border-[var(--t2)]"
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelected(f) }} />
      {selected ? (
        <>
          <FileText className="h-8 w-8 text-[var(--green)]" />
          <p className="text-sm font-medium text-[var(--foreground)]">{selected.name}</p>
          <p className="text-xs text-[var(--t2)]">{(selected.size / 1024).toFixed(1)} KB</p>
          <div className="mt-2 flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleFile() }} className="flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--amber)] to-orange-600 px-4 py-1.5 text-xs font-medium text-white">
              <Upload className="h-3 w-3" /> Upload
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelected(null) }} className="flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] px-4 py-1.5 text-xs font-medium text-[var(--t2)] hover:text-[var(--foreground)]">
              <X className="h-3 w-3" /> Descartar
            </button>
          </div>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-[var(--t2)]" />
          <p className="text-sm font-medium text-[var(--foreground)]">Sube PDF o TXT aquí</p>
          <p className="text-xs text-[var(--t2)]">o haz clic para explorar</p>
        </>
      )}
    </div>
  )
}

export default function BrainPage() {
  const { docs, loading, upload } = useBrain()
  const [uploading, setUploading] = useState(false)

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    try { await upload(file) } finally { setUploading(false) }
  }, [upload])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Upload Document</h3>
        <DropZone onFile={handleUpload} />
        {uploading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--t2)]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--amber)] border-t-transparent" />
            Procesando...
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Knowledge Base ({docs.length})</h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-[var(--bg)] animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--t2)]">No hay documentos aún. Sube un archivo arriba.</p>
        ) : (
          <div className="space-y-1">
            {docs.map((d) => (
              <div key={d.filename} className="flex items-center gap-3 rounded-lg bg-[var(--bg)] p-3 hover:bg-[var(--bg2)] transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.15)]">
                  <FileText className="h-4 w-4 text-[var(--amber)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{d.filename}</p>
                  <p className="text-xs text-[var(--t2)]">{d.chunk_count} chunks · {new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-[10px] rounded-full bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)] px-2 py-0.5">Activo</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
