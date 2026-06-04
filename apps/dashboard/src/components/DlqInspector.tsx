import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, ChevronDown, ChevronRight, RotateCcw, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import type { DeadLetter } from "../types/dashboard"

interface DlqInspectorProps {
  dlqMessages: DeadLetter[]
  isPurging: boolean
  onRefresh: () => void
  onClear: () => void
}

/* ═══════════════════════════════════════════════════
   JSON VIEWER
   ═══════════════════════════════════════════════════ */

interface JsonNodeProps {
  data: unknown
  depth?: number
  isLast?: boolean
  keyName?: string
}

function JsonNode({ data, depth = 0, isLast = true, keyName }: JsonNodeProps) {
  const [collapsed, setCollapsed] = useState(depth > 2)

  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null) return <span className="json-null">null</span>
    if (typeof value === "boolean") return <span className="json-boolean">{String(value)}</span>
    if (typeof value === "number") return <span className="json-number">{value}</span>
    if (typeof value === "string") return <span className="json-string">"{value}"</span>
    return null
  }

  const comma = isLast ? "" : ","
  const keyPrefix =
    keyName !== undefined ? (
      <>
        <span className="json-key">"{keyName}"</span>:{" "}
      </>
    ) : null

  if (data === null || typeof data !== "object") {
    return (
      <div className="leading-relaxed">
        {keyPrefix}
        {renderValue(data)}
        {comma}
      </div>
    )
  }

  const isArray = Array.isArray(data)
  const entries = isArray
    ? data.map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>)
  const openBracket = isArray ? "[" : "{"
  const closeBracket = isArray ? "]" : "}"

  if (entries.length === 0) {
    return (
      <div className="leading-relaxed">
        {keyPrefix}
        <span className="json-bracket">
          {openBracket}
          {closeBracket}
        </span>
        {comma}
      </div>
    )
  }

  return (
    <div className="leading-relaxed">
      <button type="button" className="json-toggle text-left" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? (
          <ChevronRight className="w-3 h-3 inline text-text-muted" />
        ) : (
          <ChevronDown className="w-3 h-3 inline text-text-muted" />
        )}
        {keyPrefix}
        <span className="json-bracket">{openBracket}</span>
      </button>

      {collapsed ? (
        <button
          type="button"
          className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer tech-label bg-inset border-2 border-light mx-1 hover:opacity-70 transition-opacity"
          onClick={() => setCollapsed(false)}
        >
          {entries.length} {isArray ? "itens" : "campos"}
        </button>
      ) : (
        <div className="json-indent-line">
          {entries.map(([key, val], i) => (
            <JsonNode
              key={key}
              keyName={isArray ? undefined : key}
              data={val}
              depth={depth + 1}
              isLast={i === entries.length - 1}
            />
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="leading-relaxed">
          <span className="json-bracket">{closeBracket}</span>
          {comma}
        </div>
      )}
    </div>
  )
}

function JsonViewer({ data }: { data: string }) {
  const [parsed, setParsed] = useState<{ valid: boolean; value: unknown }>(() => {
    try {
      return { valid: true, value: JSON.parse(data) }
    } catch {
      return { valid: false, value: null }
    }
  })

  const parse = useCallback((raw: string) => {
    try {
      setParsed({ valid: true, value: JSON.parse(raw) })
    } catch {
      setParsed({ valid: false, value: null })
    }
  }, [])

  if (data !== undefined && !parsed.valid) {
    try {
      const v = JSON.parse(data)
      if (v !== parsed.value) parse(data)
    } catch {
      /* keep invalid */
    }
  }

  if (!parsed.valid) {
    return (
      <pre className="text-[11px] whitespace-pre-wrap break-all leading-relaxed font-tech text-text-secondary">
        {data}
      </pre>
    )
  }

  return (
    <div className="text-[11px] overflow-x-auto font-tech">
      <JsonNode data={parsed.value} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DLQ MESSAGE CARD
   ═══════════════════════════════════════════════════ */

function DlqMessageCard({ msg, index }: { msg: DeadLetter; index: number }) {
  const [showHeaders, setShowHeaders] = useState(false)
  const [showPayload, setShowPayload] = useState(true)

  const retryCount = msg.properties.headers?.["x-retry-count"]
  const messageId = msg.properties.message_id ?? `msg-${index}`
  const hasHeaders = msg.properties.headers && Object.keys(msg.properties.headers).length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.05 }}
      className="block-3d block-red p-0 overflow-hidden"
    >
      <div
        className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 border-b border-light"
        style={{ backgroundColor: "var(--bg-inset)" }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 text-red-base" />
          <span className="text-[10px] truncate font-tech font-bold text-text-primary">{messageId}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {retryCount !== undefined ? (
            <span
              className="tech-label px-1.5 py-0.5 rounded border border-light text-orange-base"
              style={{ backgroundColor: "var(--bg-page)" }}
            >
              {String(retryCount)}× tentativas
            </span>
          ) : (
            <span
              className="tech-label px-1.5 py-0.5 rounded border border-light text-red-base"
              style={{ backgroundColor: "var(--bg-page)" }}
            >
              FATAL
            </span>
          )}
        </div>
      </div>

      {hasHeaders && (
        <div className="px-2.5 py-1 border-b border-light" style={{ backgroundColor: "var(--bg-page)" }}>
          <button
            type="button"
            className="flex items-center gap-1 tech-label w-full hover:text-blue-base transition-colors"
            onClick={() => setShowHeaders(!showHeaders)}
          >
            {showHeaders ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
            Headers
          </button>
          <AnimatePresence>
            {showHeaders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 p-1.5 rounded tech-inset">
                  <JsonViewer data={JSON.stringify(msg.properties.headers)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="px-2.5 py-1 border-b border-light" style={{ backgroundColor: "var(--bg-page)" }}>
        <button
          type="button"
          className="flex items-center gap-1 tech-label w-full hover:text-blue-base transition-colors mb-1"
          onClick={() => setShowPayload(!showPayload)}
        >
          {showPayload ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          Dados
        </button>
        <AnimatePresence>
          {showPayload && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-1.5 rounded tech-inset max-h-[170px] overflow-y-auto mb-1">
                <JsonViewer data={msg.payload} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className="px-2.5 py-1 flex items-center justify-between tech-label"
        style={{ backgroundColor: "var(--bg-inset)" }}
      >
        <span>tamanho: {msg.payload_bytes}b</span>
        <span>id: {index}</span>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════
   DLQ INSPECTOR
   ═══════════════════════════════════════════════════ */

export function DlqInspector({ dlqMessages, isPurging, onRefresh, onClear }: DlqInspectorProps) {
  const handleClear = () => {
    if (!window.confirm("Limpar DLQ? Todas as mensagens serão perdidas.")) return
    onClear()
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* ─── STICKY HEADER ─── */}
      <div
        className="shrink-0 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between px-3.5 py-2.5 layout-separator-bottom"
        style={{ backgroundColor: "var(--bg-page)" }}
      >
        <div className="section-label" style={{ "--accent-color": "var(--red-base)" } as React.CSSProperties}>
          <AlertTriangle className="label-icon text-red-base" />
          Inspetor DLQ
          <span className="label-tag text-red-base border-red-base" style={{ backgroundColor: "var(--red-top)" }}>
            Dead Letters
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {dlqMessages.length > 0 && (
            <>
              <span
                className="tech-label px-1.5 py-0.5 rounded border-2 border-red-bottom text-red-bottom"
                style={{ backgroundColor: "var(--red-top)" }}
              >
                {dlqMessages.length} msgs
              </span>
              <button type="button" onClick={handleClear} disabled={isPurging} className="tech-btn tech-btn-danger">
                <Trash2 className="w-3 h-3" />
                {isPurging ? "Limpando..." : "Limpar DLQ"}
              </button>
            </>
          )}
          <button type="button" onClick={onRefresh} className="tech-btn">
            <RotateCcw className="w-3 h-3" /> Atualizar
          </button>
        </div>
      </div>

      {/* ─── SCROLLABLE CONTENT ─── */}
      <div className="flex-1 overflow-y-auto p-3" style={{ backgroundColor: "var(--bg-inset)" }}>
        {dlqMessages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 rounded-lg border-2 border-dashed border-strong"
            style={{ backgroundColor: "var(--bg-page)" }}
          >
            <div
              className="w-8 h-8 rounded-lg grid place-items-center mb-2 text-green-bottom border-2 border-green-bottom"
              style={{ backgroundColor: "var(--green-top)", boxShadow: "0 2px 0 0 var(--green-bottom)" }}
            >
              <span className="font-tech font-bold text-base leading-none">✓</span>
            </div>
            <p className="text-sm font-bold text-secondary uppercase tracking-wide">DLQ está vazia</p>
            <p className="tech-label mt-1">Status: Saudável</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence>
              {dlqMessages.map((msg, index) => (
                <DlqMessageCard key={msg.properties.message_id ?? index} msg={msg} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  )
}
