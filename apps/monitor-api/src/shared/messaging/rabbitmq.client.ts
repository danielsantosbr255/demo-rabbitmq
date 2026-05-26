import { env } from "../config/env.js"

const rabbitUrl = new URL(env.RABBITMQ_API_URL)
const RABBIT_BASE = `${rabbitUrl.protocol}//${rabbitUrl.host}/api`
const RABBIT_AUTH =
  rabbitUrl.username && rabbitUrl.password
    ? `Basic ${Buffer.from(`${rabbitUrl.username}:${rabbitUrl.password}`).toString("base64")}`
    : undefined

export function rabbitFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {}
  if (RABBIT_AUTH) headers.Authorization = RABBIT_AUTH
  if (init?.body) headers["Content-Type"] = "application/json"
  return fetch(`${RABBIT_BASE}${path}`, { ...init, headers: { ...headers, ...init?.headers } })
}
