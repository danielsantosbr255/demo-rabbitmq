import { AnimatePresence, motion } from "framer-motion"
import { AlertOctagon, RotateCcw, Trash2 } from "lucide-react"
import type { DeadLetter } from "../types/dashboard"

interface DlqInspectorProps {
  dlqMessages: DeadLetter[]
  isPurging: boolean
  onRefresh: () => void
  onClear: () => void
}

export function DlqInspector({ dlqMessages, isPurging, onRefresh, onClear }: DlqInspectorProps) {
  const handleClear = () => {
    if (
      !window.confirm("Tem certeza que deseja limpar a DLQ? Isso removerá permanentemente todas as mensagens mortas.")
    ) {
      return
    }

    onClear()
  }

  return (
    <section
      aria-labelledby="dlq-inspector-title"
      className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-5 transition-colors"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 transition-colors">
            <AlertOctagon className="w-4 h-4 text-rose-500 dark:text-rose-450" />
          </div>
          <div>
            <h2 id="dlq-inspector-title" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Inspetor de Fila Morta (DLQ)
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Mensagens que esgotaram todas as tentativas de reprocessamento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dlqMessages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isPurging}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/40 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isPurging ? "Limpando..." : "Limpar DLQ"}
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {dlqMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 transition-colors">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 grid place-items-center mb-3">
            ✓
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">DLQ Limpa</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Todos os pipelines saudáveis — sem mensagens mortas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {dlqMessages.map((msg, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                key={msg.properties.message_id ?? index}
                className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-xl p-4 text-xs shadow-sm transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-35">
                    {msg.properties.message_id ?? `msg-${index}`}
                  </span>
                  <span className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-500 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide shrink-0">
                    {String(msg.properties.headers?.["x-retry-count"] ?? 3)} tentativas
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Payload Original
                </p>
                <pre className="bg-rose-50 dark:bg-rose-950/10 p-2.5 rounded-lg border border-rose-100 dark:border-rose-950/40 font-mono text-[10px] overflow-x-auto text-rose-700 dark:text-rose-350 whitespace-pre-wrap max-h-25">
                  {msg.payload}
                </pre>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
