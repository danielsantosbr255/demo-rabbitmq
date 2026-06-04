import type { ReactNode } from "react"
import type { QueueStats } from "../types/dashboard"
import { TimerBar } from "./TimerBar"

interface QueueNodeProps {
  title: string
  queue?: QueueStats
  icon: ReactNode
  blockClass: string
  clockOffset: number
}

export function QueueNode({ title, queue, icon, blockClass, clockOffset }: QueueNodeProps) {
  const count = queue?.messages ?? 0
  const unacked = queue?.messagesUnacked ?? 0
  const isProcessing = unacked > 0
  const isActive = isProcessing
  const hasMessages = count > 0

  const activeClass = isActive ? "is-active" : ""
  const messageClass = hasMessages ? "has-messages" : ""

  const showTimer = hasMessages && queue?.ttl && queue?.headTimestamp

  return (
    <article className={`block-3d ${blockClass} ${activeClass} ${messageClass} p-2 flex flex-col min-w-0 h-[96px]`}>
      {/* Top: title + icon */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <span className="tech-label text-[8px] block text-[var(--base-color)]">{title}</span>
          <span className="font-tech text-[9px] block truncate font-bold opacity-80" title={queue?.name}>
            {queue?.name ?? title}
          </span>
        </div>
        <div className="p-0.5 rounded bg-[var(--top-color)] text-[var(--bottom-color)] flex-shrink-0">{icon}</div>
      </div>

      {/* Middle: count + processing */}
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col">
          <span className="tech-label text-[7px] opacity-60">msgs</span>
          <span
            className="font-tech text-base font-bold leading-none tracking-tighter"
            style={{ color: "var(--base-color)" }}
          >
            {count}
          </span>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-1 tech-label text-[7px] px-0.5 py-0.5 rounded bg-[var(--glow-color)] text-[var(--bottom-color)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--bottom-color)] animate-ping" />
            {unacked} proc
          </div>
        )}
      </div>

      {/* Bottom: full-width timer (always reserves space via h-[110px]) */}
      {showTimer && queue && queue.headTimestamp !== null && queue.ttl !== null ? (
        <TimerBar headTimestamp={queue.headTimestamp} ttlMs={queue.ttl} clockOffset={clockOffset} />
      ) : (
        <div className="h-[14px]" />
      )}
    </article>
  )
}
