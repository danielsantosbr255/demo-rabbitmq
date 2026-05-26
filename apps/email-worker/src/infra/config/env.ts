import { z } from "zod/v4"

try {
  process.loadEnvFile()
} catch {}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  RABBITMQ_URL: z.url(),
  SMTP_HOST: z.string().default("127.0.0.1"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  EMAIL_FROM: z.string().default("notifications@example.com"),
  MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  PREFETCH_COUNT: z.coerce.number().int().positive().default(1),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten())
  process.exit(1)
}

export const env = parsed.data
