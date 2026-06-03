import { Moon, RotateCcw, Sun, Zap } from "lucide-react"

interface HeaderProps {
  onSync: () => void
  isPipelineActive: boolean
  isDarkMode: boolean
  toggleTheme: () => void
}

export function Header({ onSync, isPipelineActive, isDarkMode, toggleTheme }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between sticky top-0 z-10 shadow-sm transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 transition-colors">
          <Zap className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Centro de Resiliência
          </h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Monitor de Microsserviços Tolerante a Falhas
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:flex-shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <button
          type="button"
          onClick={onSync}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Sincronizar
        </button>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            isPipelineActive
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
              : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
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
