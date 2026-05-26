import { useCallback, useEffect, useRef, useState } from "react"
import { clearDlqMessages, fetchDlqMessages, queueStreamUrl } from "../services/api"
import type { DeadLetter, LogEvent, QueueStats } from "../types/dashboard"

export function useDashboardData() {
  const [queues, setQueues] = useState<QueueStats[]>([])
  const [dlqMessages, setDlqMessages] = useState<DeadLetter[]>([])
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [isPurging, setIsPurging] = useState(false)
  const [clockOffset, setClockOffset] = useState(0)

  const prevQueuesRef = useRef<QueueStats[]>([])
  const hasLoggedRef = useRef(new Set<string>())

  const addLog = useCallback((message: string, type: LogEvent["type"] = "info") => {
    setLogs((current) => [{ id: crypto.randomUUID(), time: new Date(), message, type }, ...current].slice(0, 80))
  }, [])

  const fetchDlq = useCallback(async () => {
    try {
      const data = await fetchDlqMessages()
      setDlqMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      addLog(`Falha ao carregar DLQ: ${message}`, "error")
    }
  }, [addLog])

  const clearDlq = useCallback(async () => {
    setIsPurging(true)
    try {
      await clearDlqMessages()
      setDlqMessages([])
      addLog("DLQ limpa com sucesso.", "success")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      addLog(`Falha ao limpar DLQ: ${message}`, "error")
    } finally {
      setIsPurging(false)
    }
  }, [addLog])

  useEffect(() => {
    fetchDlq()

    const eventSource = new EventSource(queueStreamUrl)

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { serverTime: number; queues: QueueStats[] }
        const data = payload.queues

        setClockOffset(payload.serverTime - Date.now())

        const previousMap = new Map(prevQueuesRef.current.map((queue) => [queue.name, queue.messages]))

        data.forEach((queue) => {
          const previousCount = previousMap.get(queue.name) ?? 0
          const key = queue.name

          if (queue.name.includes("dlq") && queue.messages !== previousCount) {
            fetchDlq()
          }

          if (queue.messages > 0 && previousCount === 0 && !hasLoggedRef.current.has(key)) {
            hasLoggedRef.current.add(key)
            if (queue.name.includes("retry")) {
              addLog(`[Pipeline] Mensagem encaminhada para ${queue.name}`, "warning")
            } else if (queue.name.includes("dlq")) {
              addLog("[Pipeline] Tentativas esgotadas — mensagem na fila morta!", "error")
            }
          } else if (queue.messages === 0 && previousCount > 0) {
            hasLoggedRef.current.delete(key)
            if (queue.name.includes("retry")) {
              addLog(`[Pipeline] Atraso de ${queue.name} expirado — reprocessando...`, "info")
            }
          }
        })

        prevQueuesRef.current = data
        setQueues(data)
      } catch (error) {
        console.error("Falha ao parsear SSE:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("Erro na conexão SSE:", error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [addLog, fetchDlq])

  return {
    queues,
    dlqMessages,
    logs,
    isPurging,
    clockOffset,
    addLog,
    fetchDlq,
    clearDlq,
  }
}
