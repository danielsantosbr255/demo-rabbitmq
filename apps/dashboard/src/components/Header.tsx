import { Activity, Hexagon, Moon, RotateCcw, Sun } from "lucide-react"

interface HeaderProps {
  onSync: () => void
  isPipelineActive: boolean
  isDarkMode: boolean
  toggleTheme: () => void
}

export function Header({ onSync, isPipelineActive, isDarkMode, toggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-frame layout-separator-bottom">
      <div className="px-4.5 py-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Modern & Alive Logo */}
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="relative flex items-center justify-center w-9.5 h-9.5">
            {/* Animated glowing background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-green-400 rounded-[11px] blur-[6px] opacity-60 group-hover:opacity-100 transition-opacity duration-300 dark:from-blue-600 dark:to-green-500" />
            {/* Main icon container */}
            <div className="relative w-full h-full bg-page rounded-[11px] border border-transparent shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.8),_0_1.5px_6px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden">
              <Hexagon
                className="absolute w-6 h-6 text-blue-top animate-[spin_10s_linear_infinite]"
                strokeWidth={1.5}
              />
              <Activity className="w-4 h-4 text-blue-bottom relative z-10" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight text-primary leading-none mb-0.5 flex items-center gap-1">
              Nexus
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-base to-green-base">Flow</span>
            </h1>
            <p className="tech-label text-[8px] opacity-80">Roteamento de Mensagens</p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            className="tech-btn !p-1.5 !rounded-full"
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-yellow-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-bottom" />
            )}
          </button>

          <button type="button" onClick={onSync} className="tech-btn">
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {/* Status Badge — Redesigned Cyber Status Capsule */}
          <div className="ml-1.5">
            {isPipelineActive ? (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-lg border shadow-[0_2px_6px_rgba(34,197,94,0.15)] select-none transition-all duration-300 hover:scale-102 cursor-default"
                style={{
                  backgroundColor: "var(--green-top)",
                  borderColor: "var(--green-base)",
                }}
              >
                {/* Ping Dot Container */}
                <div className="relative w-2 h-2 flex items-center justify-center flex-shrink-0">
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: "var(--green-base)" }}
                  />
                  <span
                    className="relative block w-1.5 h-1.5 rounded-full shadow-[0_0_5px_var(--green-base)]"
                    style={{ backgroundColor: "var(--green-base)" }}
                  />
                </div>
                <span
                  className="font-tech text-[9px] font-extrabold tracking-widest uppercase"
                  style={{ color: "var(--green-bottom)" }}
                >
                  Pipeline Ativo
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-lg border select-none cursor-default opacity-60"
                style={{
                  backgroundColor: "var(--bg-inset)",
                  borderColor: "var(--border-light)",
                }}
              >
                {/* Offline Dot */}
                <div className="relative w-2 h-2 flex items-center justify-center flex-shrink-0">
                  <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
                </div>
                <span className="font-tech text-[9px] font-extrabold tracking-widest text-text-muted uppercase">
                  Offline
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
