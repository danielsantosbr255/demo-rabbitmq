import { env } from "../../shared/config/env.js"
import { logger } from "../../shared/logger/logger.js"
import type { ISmsRepository, TSmsPayload } from "./sms.types.js"

export class StubSmsRepository implements ISmsRepository {
  async send(payload: TSmsPayload): Promise<void> {
    if (payload.body.includes("fail")) {
      throw new Error("Simulated transient SMS transmission failure")
    }

    await new Promise((resolve) => setTimeout(resolve, env.SMS_SEND_DELAY_IN_MS))

    logger.info({ to: payload.to, body: payload.body }, "[STUB] SMS sent (simulated)")
  }
}
