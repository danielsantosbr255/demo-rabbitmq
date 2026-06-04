import { Activity, Clock, Mail, MessageSquare, Server, Shield, Terminal } from "lucide-react"
import { useState } from "react"
import { DlqInspector } from "./components/DlqInspector"
import { EventLog } from "./components/EventLog"
import { Header } from "./components/Header"
import { NotificationForm } from "./components/NotificationForm"
import { PipelineSection } from "./components/PipelineSection"
import { useDarkMode } from "./hooks/useDarkMode"
import { useDashboardData } from "./hooks/useDashboardData"
import { postNotification } from "./services/api"
import type { NotificationFormData } from "./types/dashboard"

function App() {
  const { toggleTheme, isDarkMode } = useDarkMode()
  const { queues, dlqMessages, logs, isPurging, clockOffset, addLog, fetchDlq, clearDlq, clearLogs } =
    useDashboardData()

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
    { title: "Principal", queueName: "q.email", icon: <Activity className="w-3.5 h-3.5" />, blockClass: "block-blue" },
    {
      title: "Tentativa 1",
      queueName: "q.email.retry.0",
      icon: <Clock className="w-3.5 h-3.5" />,
      blockClass: "block-yellow",
    },
    {
      title: "Tentativa 2",
      queueName: "q.email.retry.1",
      icon: <Clock className="w-3.5 h-3.5" />,
      blockClass: "block-orange",
    },
    {
      title: "Tentativa 3",
      queueName: "q.email.retry.2",
      icon: <Clock className="w-3.5 h-3.5" />,
      blockClass: "block-red",
    },
  ]

  const smsPipelineItems = [
    { title: "Principal", queueName: "q.sms", icon: <Activity className="w-3.5 h-3.5" />, blockClass: "block-green" },
    {
      title: "Tentativa 1",
      queueName: "q.sms.retry.0",
      icon: <Clock className="w-3.5 h-3.5" />,
      blockClass: "block-yellow",
    },
    {
      title: "Tentativa 2",
      queueName: "q.sms.retry.1",
      icon: <Clock className="w-3.5 h-3.5" />,
      blockClass: "block-orange",
    },
    {
      title: "Tentativa 3",
      queueName: "q.sms.retry.2",
      icon: <Clock className="w-3.5 h-3.5" />,
      blockClass: "block-red",
    },
  ]

  return (
    <main className="h-screen flex flex-col font-sans bg-frame text-primary">
      <Header
        onSync={() => {
          fetchDlq()
          addLog("Sincronização manual realizada.", "info")
        }}
        isPipelineActive={true}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* 3-column layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="w-[250px] xl:w-[270px] shrink-0 overflow-y-auto flex flex-col bg-frame layout-separator-right">
          <div className="p-3.5 flex flex-col gap-3 flex-1">
            <div className="section-label" style={{ "--accent-color": "var(--blue-base)" } as React.CSSProperties}>
              <Server className="label-icon" />
              API Gateway
              <span className="label-tag">:3000</span>
            </div>
            <NotificationForm onSend={handleSend} isSending={isSending} />
          </div>
        </aside>

        {/* ─── CENTER PAGE ─── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-page">
          {/* Pipeline */}
          <div className="shrink-0 p-3.5 pb-2.5 overflow-x-auto bg-page layout-separator-bottom">
            <div className="flex items-center justify-between mb-3">
              <div className="section-label" style={{ "--accent-color": "var(--green-base)" } as React.CSSProperties}>
                <Shield className="label-icon" />
                Roteamento
                <span className="label-tag">RabbitMQ</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <PipelineSection
                label="Fluxo de E-mail"
                labelIcon={<Mail className="w-3.5 h-3.5 text-blue-base" />}
                items={emailPipelineItems}
                queues={queues}
                clockOffset={clockOffset}
              />
              <PipelineSection
                label="Fluxo de SMS"
                labelIcon={<MessageSquare className="w-3.5 h-3.5 text-green-base" />}
                items={smsPipelineItems}
                queues={queues}
                clockOffset={clockOffset}
              />
            </div>
          </div>

          {/* DLQ */}
          <DlqInspector dlqMessages={dlqMessages} isPurging={isPurging} onRefresh={fetchDlq} onClear={clearDlq} />
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="w-[250px] xl:w-[270px] shrink-0 flex flex-col min-h-0 overflow-hidden bg-frame layout-separator-left">
          <div className="shrink-0 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div
              className="section-label text-[10px]"
              style={{ "--accent-color": "var(--orange-base)" } as React.CSSProperties}
            >
              <Terminal className="label-icon" />
              Eventos
              <span className="label-tag">SSE</span>
            </div>
            <button type="button" onClick={clearLogs} className="tech-btn text-[8px] py-0.5 px-1.5">
              Limpar
            </button>
          </div>

          <EventLog logs={logs} />
        </aside>
      </div>
    </main>
  )
}

export default App
