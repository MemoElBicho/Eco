import { cn } from "@/lib/utils"
import type { MessageOut } from "@/lib/api"

export function MessageBubble({ message }: { message: MessageOut }) {
  const isOut = message.direction === "out"

  return (
    <div className={cn("flex gap-2", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isOut
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn("mt-1 text-right text-[0.65rem] opacity-60", isOut && "text-primary-foreground")}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}
