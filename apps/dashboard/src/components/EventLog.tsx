import { format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import type { LogEvent } from "../types/dashboard"

const logColors: Record<LogEvent["type"], string> = {
  info: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
}

interface EventLogProps {
  logs: LogEvent[]
}

export function EventLog({ logs }: EventLogProps) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 font-mono text-[11px]">
      <AnimatePresence initial={false}>
        {logs.length > 0 ? (
          logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-l-2 pl-2.5 py-1"
              style={{ borderColor: logColors[log.type] }}
            >
              <span className="text-[9px] text-slate-400 block">{format(log.time, "HH:mm:ss.SSS")}</span>
              <span className="block leading-relaxed break-words" style={{ color: logColors[log.type] }}>
                {log.message}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="text-slate-400 text-center py-16 italic text-xs">Aguardando eventos...</div>
        )}
      </AnimatePresence>
    </div>
  )
}
