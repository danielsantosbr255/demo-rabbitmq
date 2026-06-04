import { format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import type { LogEvent } from "../types/dashboard"

const logStyles: Record<LogEvent["type"], { colorVar: string; prefix: string }> = {
  info: { colorVar: "var(--blue-base)", prefix: "[INFO]" },
  success: { colorVar: "var(--green-base)", prefix: "[ OK ]" },
  warning: { colorVar: "var(--orange-base)", prefix: "[WARN]" },
  error: { colorVar: "var(--red-base)", prefix: "[ERR ]" },
}

interface EventLogProps {
  logs: LogEvent[]
}

export function EventLog({ logs }: EventLogProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-panel font-tech text-[9px]">
      <AnimatePresence initial={false}>
        {logs.length > 0 ? (
          logs.map((log) => {
            const style = logStyles[log.type]
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-start gap-1.5 px-2.5 py-1.5 border-b border-light hover:bg-inset transition-colors"
              >
                <div className="flex flex-col flex-shrink-0 min-w-[44px]">
                  <span className="text-[8px] text-text-muted">{format(log.time, "HH:mm:ss")}</span>
                  <span className="font-bold text-[8px]" style={{ color: style.colorVar }}>
                    {style.prefix}
                  </span>
                </div>
                <span className="leading-relaxed break-words text-text-primary pt-0.5">{log.message}</span>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-10 text-text-muted italic opacity-70">
            <div className="mb-1 text-lg">_</div>
            aguardando_eventos...
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
