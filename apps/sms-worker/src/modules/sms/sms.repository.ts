import { env } from "../../config/env.js"
import { logger } from "../../infra/logger/logger.js"
import { FatalNotificationError, TransientNotificationError } from "../../shared/errors/app.error.js"
import type { ISmsRepository, TSmsPayload } from "./sms.types.js"

export class StubSmsRepository implements ISmsRepository {
  async send(payload: TSmsPayload): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, env.SMS_SEND_DELAY_IN_MS))

    if (payload.body.includes("fail")) {
      throw new TransientNotificationError("Simulated transient SMS transmission failure")
    }

    if (payload.body.includes("fatal")) {
      throw new FatalNotificationError("Simulated fatal SMS transmission failure")
    }

    logger.info({ to: payload.to, body: payload.body }, "[STUB] SMS sent (simulated)")
  }
}
