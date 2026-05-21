import { AlertOctagon, RotateCcw, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DeadLetter } from '../types/dashboard';

interface DlqInspectorProps {
  dlqMessages: DeadLetter[];
  isPurging: boolean;
  onRefresh: () => void;
  onClear: () => void;
}

export function DlqInspector({ dlqMessages, isPurging, onRefresh, onClear }: DlqInspectorProps) {
  const handleClear = () => {
    if (!window.confirm('Tem certeza que deseja limpar a DLQ? Isso removerá permanentemente todas as mensagens mortas.')) {
      return;
    }

    onClear();
  };

  return (
    <section aria-labelledby="dlq-inspector-title" className="flex-1 overflow-y-auto bg-slate-50 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h2 id="dlq-inspector-title" className="text-sm font-semibold text-slate-700">Inspetor de Fila Morta (DLQ)</h2>
            <p className="text-[11px] text-slate-400">Mensagens que esgotaram todas as tentativas de reprocessamento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dlqMessages.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isPurging}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isPurging ? 'Limpando...' : 'Limpar DLQ'}
            </button>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {dlqMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mb-3">
            ✓
          </div>
          <p className="text-sm font-semibold text-slate-500">DLQ Limpa</p>
          <p className="text-xs text-slate-400 mt-1">Todos os pipelines saudáveis — sem mensagens mortas.</p>
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
                className="bg-white border border-rose-100 hover:border-rose-200 rounded-xl p-4 text-xs shadow-sm transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-35">
                    {msg.properties.message_id ?? `msg-${index}`}
                  </span>
                  <span className="bg-rose-50 border border-rose-200 text-rose-500 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide shrink-0">
                    {String(msg.properties.headers?.['x-retry-count'] ?? 3)} tentativas
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payload Original</p>
                <pre className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-mono text-[10px] overflow-x-auto text-rose-700 whitespace-pre-wrap max-h-25">
                  {msg.payload}
                </pre>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
