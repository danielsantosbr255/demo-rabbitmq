import { Dices, Mail, MessageSquare, Send } from "lucide-react"
import { type FormEvent, useCallback, useState } from "react"
import type { NotificationChannel, NotificationFormData } from "../types/dashboard"

interface NotificationFormProps {
  onSend: (data: NotificationFormData) => Promise<void>
  isSending: boolean
}

const EMAIL_TEMPLATES = [
  {
    to: "maria.silva@corp.com.br",
    subject: "Deploy falhou no ambiente staging",
    body: "O pipeline de deploy detectou falha no build #4821. Container api-gateway não iniciou corretamente. Verifique os logs do Kubernetes.",
  },
  {
    to: "dev-team@startup.io",
    subject: "Novo usuário cadastrado",
    body: "Um novo usuário completou o onboarding: João Pedro. Plano: Enterprise. Revenue: R$ 2.400/mês.",
  },
  {
    to: "alerts@monitor.sys",
    subject: "CPU acima de 90% — Alerta crítico",
    body: "Servidor prod-worker-03 está com uso de CPU em 94% há mais de 5 minutos. Ação recomendada: escalar horizontalmente.",
  },
  {
    to: "ana.costa@fintech.com",
    subject: "Relatório semanal de transações",
    body: "Resumo da semana: 14.832 transações processadas, volume total R$ 2.3M, taxa de aprovação 97.2%.",
  },
  {
    to: "security@empresa.com.br",
    subject: "Tentativa de acesso suspeita",
    body: "IP 192.168.45.201 tentou 15 logins falhos na conta admin@painel. Conta bloqueada temporariamente.",
  },
]

const SMS_TEMPLATES = [
  { to: "+5511987654321", body: "Seu código de verificação é: 847293. Válido por 5 minutos." },
  {
    to: "+5521912345678",
    body: "ALERTA: Compra de R$ 1.249,90 detectada no cartão final 4832. Ligue 0800-123-4567.",
  },
  { to: "+5531998765432", body: "Olá Ana! Seu pedido #7821 saiu para entrega. Rastreie: https://rastr.io/7821" },
  { to: "+5548911223344", body: "Promoção relâmpago! 40% OFF em planos Pro até meia-noite com o cupom FLASH40." },
  { to: "+5519998877665", body: "Seu saldo: R$ 3.482,17. Última transação: PIX R$ 150,00 para João Silva." },
]

const initialState: NotificationFormData = {
  channel: "email" as NotificationChannel,
  to: "maria.silva@corp.com.br",
  subject: "Deploy falhou no ambiente staging",
  body: "O pipeline de deploy detectou falha no build #4821. Container api-gateway não iniciou corretamente.",
}

export function NotificationForm({ onSend, isSending }: NotificationFormProps) {
  const [formValues, setFormValues] = useState<NotificationFormData>(initialState)

  const randomize = useCallback(() => {
    if (formValues.channel === "email") {
      const template = EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)]
      setFormValues({ channel: "email", ...template })
    } else {
      const template = SMS_TEMPLATES[Math.floor(Math.random() * SMS_TEMPLATES.length)]
      setFormValues({ channel: "sms", to: template.to, subject: "", body: template.body })
    }
  }, [formValues.channel])

  const handleChannelChange = (channel: NotificationChannel) => {
    if (channel === "email") {
      const template = EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)]
      setFormValues({ channel: "email", ...template })
    } else {
      const template = SMS_TEMPLATES[Math.floor(Math.random() * SMS_TEMPLATES.length)]
      setFormValues({ channel: "sms", to: template.to, subject: "", body: template.body })
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSend(formValues)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      {/* Channel selector — Clean Neumorphic without borders */}
      <fieldset className="space-y-1">
        <legend className="tech-label">Canal</legend>
        <div
          className="flex p-0.5 rounded-md shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1.5px_5px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: "var(--bg-inset)" }}
        >
          {(["email", "sms"] as NotificationChannel[]).map((channel) => {
            const isSelected = formValues.channel === channel
            const Icon = channel === "email" ? Mail : MessageSquare
            return (
              <button
                key={channel}
                type="button"
                onClick={() => handleChannelChange(channel)}
                className={`flex-1 py-1 font-tech text-[10.5px] font-bold uppercase rounded flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  isSelected
                    ? "bg-page text-blue-base shadow-sm"
                    : "text-text-muted hover:text-text-primary opacity-70 hover:opacity-100"
                }`}
              >
                <Icon className="w-3 h-3" />
                {channel === "email" ? "E-mail" : "SMS"}
              </button>
            )
          })}
        </div>
      </fieldset>

      <button type="button" onClick={randomize} className="tech-btn">
        <Dices className="w-3 h-3" />
        Aleatório
      </button>

      <div>
        <label htmlFor="to" className="tech-label block mb-0.5">
          {formValues.channel === "email" ? "Destinatário" : "Telefone"}
        </label>
        <input
          id="to"
          type="text"
          required
          className="tech-input w-full"
          value={formValues.to}
          onChange={(event) => setFormValues({ ...formValues, to: event.target.value })}
        />
      </div>

      {formValues.channel === "email" && (
        <div>
          <label htmlFor="subject" className="tech-label block mb-0.5">
            Assunto
          </label>
          <input
            id="subject"
            type="text"
            required
            className="tech-input w-full"
            value={formValues.subject}
            onChange={(event) => setFormValues({ ...formValues, subject: event.target.value })}
          />
        </div>
      )}

      <div>
        <label htmlFor="body" className="tech-label block mb-0.5">
          Mensagem
        </label>
        <textarea
          id="body"
          required
          rows={3}
          className="tech-input w-full resize-none leading-relaxed"
          value={formValues.body}
          onChange={(event) => setFormValues({ ...formValues, body: event.target.value })}
        />
      </div>

      <button type="submit" disabled={isSending} className="tech-btn tech-btn-primary w-full py-2 mt-1.5">
        <Send className="w-3.5 h-3.5" />
        {isSending ? "Enviando..." : "Enviar Mensagem"}
      </button>
    </form>
  )
}
