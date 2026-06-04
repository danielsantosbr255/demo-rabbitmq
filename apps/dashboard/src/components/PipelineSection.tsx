import { ArrowRight, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import type { QueueStats } from "../types/dashboard"
import { QueueNode } from "./QueueNode"

interface PipelineItem {
  title: string
  queueName: string
  icon: ReactNode
  blockClass: string
}

interface PipelineSectionProps {
  label: string
  labelIcon?: ReactNode
  items: PipelineItem[]
  queues: QueueStats[]
  clockOffset: number
}

export function PipelineSection({ label, labelIcon, items, queues, clockOffset }: PipelineSectionProps) {
  const getQueue = (queueName: string) => queues.find((queue) => queue.name === queueName)

  return (
    <section className="tech-panel p-2.5" style={{ backgroundColor: "var(--bg-inset)" }}>
      {/* Section header */}
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <h3 className="tech-label text-[8px] flex items-center gap-1.5">
          {labelIcon}
          <ChevronRight className="w-2.5 h-2.5 text-text-muted" />
          {label}
        </h3>
        <div className="flex-1 h-px bg-border-light" />
      </div>

      {/* Pipeline flow */}
      <div className="flex flex-col gap-2 sm:gap-0">
        {/* Desktop: horizontal flow with tight spacing and bold arrows */}
        <div className="hidden sm:flex items-stretch gap-1">
          {items.map((item, index) => {
            const queue = getQueue(item.queueName)
            const isActive = (queue?.messagesUnacked ?? 0) > 0

            return (
              <div key={item.queueName} className="flex items-stretch gap-1 flex-1 min-w-0">
                <div className="flex-1">
                  <QueueNode
                    title={item.title}
                    queue={queue}
                    icon={item.icon}
                    blockClass={item.blockClass}
                    clockOffset={clockOffset}
                  />
                </div>
                {index < items.length - 1 && (
                  <div className="flex items-center justify-center w-3 flex-shrink-0">
                    <ArrowRight
                      className="w-3 h-3 transition-colors duration-200"
                      style={{ color: isActive ? "var(--orange-base)" : "var(--border-strong)" }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: vertical stack */}
        <div className="flex flex-col gap-2 sm:hidden">
          {items.map((item, index) => {
            const queue = getQueue(item.queueName)
            const isActive = (queue?.messagesUnacked ?? 0) > 0

            return (
              <div key={item.queueName}>
                <QueueNode
                  title={item.title}
                  queue={queue}
                  icon={item.icon}
                  blockClass={item.blockClass}
                  clockOffset={clockOffset}
                />
                {index < items.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight
                      className="w-3 h-3 rotate-90 transition-colors duration-200"
                      style={{ color: isActive ? "var(--orange-base)" : "var(--border-strong)" }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
