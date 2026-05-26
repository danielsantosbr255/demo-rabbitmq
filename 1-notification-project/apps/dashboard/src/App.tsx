import { Activity, Clock, HelpCircle, Mail, MessageSquare, Server } from "lucide-react"
import { useState } from "react"
import { DlqInspector } from "./components/DlqInspector"
import { EventLog } from "./components/EventLog"
import { Header } from "./components/Header"
import { NotificationForm } from "./components/NotificationForm"
import { PipelineSection } from "./components/PipelineSection"
import { useDashboardData } from "./hooks/useDashboardData"
import { postNotification } from "./services/api"
import type { NotificationFormData } from "./types/dashboard"

function App() {
  const { queues, dlqMessages, logs, isPurging, clockOffset, addLog, fetchDlq, clearDlq } = useDashboardData()

  const [isSending, setIsSending] = useState(false)

  const handleSend = async (formData: NotificationFormData) => {
    setIsSending(true)
    addLog(`Gateway: POST /notifications [canal=${formData.channel}]`, "info")

    const response = await postNotification(formData)

    if (response.ok) {
      addLog(`Gateway: 202 Aceito — enfileirado em q.${formData.channel}`, "success")
    } else {
      addLog(`Gateway: ${response.status} — ${response.message}`, "error")
    }

    setIsSending(false)
  }

  const emailPipelineItems = [
    {
      title: "Principal",
      queueName: "q.email",
      icon: <Activity className="w-3 h-3" />,
      activeColor: "#3b82f6",
      activeBg: "#eff6ff",
    },
    {
      title: "Tentativa 1",
      queueName: "q.email.retry.0",
      icon: <Clock className="w-3 h-3" />,
      activeColor: "#f59e0b",
      activeBg: "#fffbeb",
    },
    {
      title: "Tentativa 2",
      queueName: "q.email.retry.1",
      icon: <Clock className="w-3 h-3" />,
      activeColor: "#f97316",
      activeBg: "#fff7ed",
    },
    {
      title: "Tentativa 3",
      queueName: "q.email.retry.2",
      icon: <Clock className="w-3 h-3" />,
      activeColor: "#ef4444",
      activeBg: "#fef2f2",
    },
  ]

  const smsPipelineItems = [
    {
      title: "Principal",
      queueName: "q.sms",
      icon: <Activity className="w-3 h-3" />,
      activeColor: "#10b981",
      activeBg: "#f0fdf4",
    },
    {
      title: "Tentativa 1",
      queueName: "q.sms.retry.0",
      icon: <Clock className="w-3 h-3" />,
      activeColor: "#f59e0b",
      activeBg: "#fffbeb",
    },
    {
      title: "Tentativa 2",
      queueName: "q.sms.retry.1",
      icon: <Clock className="w-3 h-3" />,
      activeColor: "#f97316",
      activeBg: "#fff7ed",
    },
    {
      title: "Tentativa 3",
      queueName: "q.sms.retry.2",
      icon: <Clock className="w-3 h-3" />,
      activeColor: "#ef4444",
      activeBg: "#fef2f2",
    },
  ]

  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Header
        onSync={() => {
          fetchDlq()
          addLog("Sincronização manual realizada.", "info")
        }}
        isPipelineActive={true}
      />

      <div className="grid min-h-[calc(100vh-57px)] grid-cols-1 gap-0 xl:grid-cols-[320px_minmax(0,1fr)_320px] overflow-hidden">
        <aside className="w-full xl:max-w-[320px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-5 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <Server className="w-4 h-4 text-indigo-400" /> Despachante API Gateway
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                :3000
              </span>
            </div>

            <NotificationForm onSend={handleSend} isSending={isSending} />
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <Activity className="w-4 h-4 text-emerald-500" /> Pipeline de Resiliência Ativo
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                RABBITMQ
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <PipelineSection
                label="Topologia E-mail"
                icon={<Mail className="w-3.5 h-3.5 text-sky-500" />}
                items={emailPipelineItems}
                queues={queues}
                clockOffset={clockOffset}
              />
              <PipelineSection
                label="Topologia SMS"
                icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                items={smsPipelineItems}
                queues={queues}
                clockOffset={clockOffset}
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> 3 tentativas com atraso exponencial antes da fila morta (DLQ).
            </p>
          </div>

          <DlqInspector dlqMessages={dlqMessages} isPurging={isPurging} onRefresh={fetchDlq} onClear={clearDlq} />
        </div>

        <aside className="w-full xl:max-w-[320px] border-l border-slate-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <Activity className="w-4 h-4 text-slate-400" /> Stream de Eventos
            </h2>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">SSE STREAM</span>
          </div>

          <EventLog logs={logs} />
        </aside>
      </div>
    </main>
  )
}

export default App
