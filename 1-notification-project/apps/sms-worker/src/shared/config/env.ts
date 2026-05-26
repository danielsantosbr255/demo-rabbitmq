import { z } from "zod/v4"

try {
  process.loadEnvFile()
} catch (_error) {
  // Ignore in docker
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  RABBITMQ_URL: z.url(),
  MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  PREFETCH_COUNT: z.coerce.number().int().positive().default(1),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten())
  process.exit(1)
}

export const env = parsed.data
