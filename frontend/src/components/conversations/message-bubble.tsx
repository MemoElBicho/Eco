"use client"

interface Message {
  id: string
  content: string
  direction: "in" | "out" | string
  created_at: string
}

export function MessageBubble({ message }: { message: Message }) {
  const isOut = message.direction === "out"

  return (
    <div className={`flex gap-2 ${isOut ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed ${
          isOut
            ? "rounded-2xl rounded-br-md bg-gradient-to-r from-[var(--amber)] to-orange-600 text-white"
            : "rounded-2xl rounded-bl-md bg-[var(--surface)] text-[var(--foreground)]"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`mt-1 text-right text-[10px] ${isOut ? "text-white/60" : "text-[var(--t2)]"}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}
