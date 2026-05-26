import { type FormEvent, useState } from "react"
import type { NotificationChannel, NotificationFormData } from "../types/dashboard"

interface NotificationFormProps {
  onSend: (data: NotificationFormData) => Promise<void>
  isSending: boolean
}

const initialState = {
  channel: "email" as NotificationChannel,
  to: "john@mail.com",
  subject: "Teste de simulação",
  body: "Verificando topologia avançada de resiliência do monorepo!",
}

export function NotificationForm({ onSend, isSending }: NotificationFormProps) {
  const [formValues, setFormValues] = useState<NotificationFormData>(initialState)

  const handleChannelChange = (channel: NotificationChannel) => {
    setFormValues((current) => ({
      channel,
      to: channel === "email" ? "john@mail.com" : "+5511987654321",
      subject: channel === "email" ? "Teste de simulação" : "",
      body: current.body,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSend(formValues)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset className="space-y-2">
        <legend className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canal</legend>
        <div
          className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl"
          role="radiogroup"
          aria-label="Escolha do canal de notificação"
        >
          {(["email", "sms"] as NotificationChannel[]).map((channel) => (
            <button
              key={channel}
              type="button"
              aria-pressed={formValues.channel === channel}
              onClick={() => handleChannelChange(channel)}
              className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                formValues.channel === channel
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {channel === "email" ? "✉ E-mail" : "💬 SMS"}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="to" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          {formValues.channel === "email" ? "E-mail do Destinatário" : "Número de Telefone"}
        </label>
        <input
          id="to"
          type="text"
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all font-mono"
          value={formValues.to}
          onChange={(event) => setFormValues({ ...formValues, to: event.target.value })}
        />
      </div>

      {formValues.channel === "email" && (
        <div>
          <label
            htmlFor="subject"
            className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5"
          >
            Assunto
          </label>
          <input
            id="subject"
            type="text"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
            value={formValues.subject}
            onChange={(event) => setFormValues({ ...formValues, subject: event.target.value })}
          />
        </div>
      )}

      <div>
        <label htmlFor="body" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          Corpo da Mensagem
        </label>
        <textarea
          id="body"
          required
          rows={4}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-none transition-all font-mono"
          value={formValues.body}
          onChange={(event) => setFormValues({ ...formValues, body: event.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={isSending}
        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 active:scale-[0.98] text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <span className="text-white">{isSending ? "Enviando..." : "Enviar Notificação"}</span>
      </button>
    </form>
  )
}
