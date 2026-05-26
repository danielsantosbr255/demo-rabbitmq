import { RotateCcw, Zap } from "lucide-react"

interface HeaderProps {
  onSync: () => void
  isPipelineActive: boolean
}

export function Header({ onSync, isPipelineActive }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
          <Zap className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-tight">Centro de Resiliência</h1>
          <p className="text-[11px] text-slate-400 font-medium">Monitor de Microsserviços Tolerante a Falhas</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:flex-shrink-0">
        <button
          type="button"
          onClick={onSync}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Sincronizar
        </button>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            isPipelineActive
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : "text-slate-500 bg-slate-100 border-slate-200"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: isPipelineActive ? "#10b981" : "#94a3b8" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: isPipelineActive ? "#059669" : "#64748b" }}
            />
          </span>
          {isPipelineActive ? "Pipeline Ativo" : "Pipeline Inativo"}
        </div>
      </div>
    </header>
  )
}
