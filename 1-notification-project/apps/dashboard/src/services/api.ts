import type { DeadLetter, NotificationFormData } from "../types/dashboard"

const INSPECTOR_URL = import.meta.env.VITE_INSPECTOR_URL ?? "http://localhost:3001"
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:3000"

export const queueStreamUrl = `${INSPECTOR_URL}/queues/stream`

export async function fetchDlqMessages(): Promise<DeadLetter[]> {
  const response = await fetch(`${INSPECTOR_URL}/queues/dlq`)
  if (!response.ok) {
    throw new Error(response.statusText || "Falha ao carregar DLQ")
  }

  return response.json()
}

export async function clearDlqMessages(): Promise<void> {
  const response = await fetch(`${INSPECTOR_URL}/queues/dlq`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(response.statusText || "Falha ao limpar DLQ")
  }
}

export async function postNotification(
  formData: NotificationFormData,
): Promise<{ ok: boolean; status: number; message: string }> {
  const innerPayload: Record<string, unknown> = {
    channel: formData.channel,
    body: formData.body,
    to: formData.to,
  }

  if (formData.channel === "email") {
    innerPayload.subject = formData.subject
  }

  const payload = {
    channel: formData.channel,
    payload: innerPayload,
  }

  const response = await fetch(`${GATEWAY_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const responseBody = await response.json().catch(() => ({}))
  const message =
    typeof responseBody === "object" && responseBody !== null && "message" in responseBody
      ? ((responseBody as { message?: string }).message ?? response.statusText)
      : response.statusText

  return {
    ok: response.ok,
    status: response.status,
    message: String(message ?? "Falha na requisição"),
  }
}
