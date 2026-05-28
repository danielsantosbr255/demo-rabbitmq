import { FatalNotificationError } from "../../shared/errors/app.error.js"
import { logger } from "../../shared/logger/logger.js"
import type { ISmsRepository, TSmsPayload } from "./sms.types.js"

export class SmsNotificationService {
  constructor(private readonly repository: ISmsRepository) {}

  async process(messageId: string, payload: TSmsPayload): Promise<void> {
    logger.info({ messageId, to: payload.to }, "Processing SMS notification")

    if (!payload.to || !payload.body) {
      throw new FatalNotificationError("Invalid SMS payload: missing required fields")
    }

    await this.repository.send({ to: payload.to, body: payload.body })

    logger.info({ messageId, to: payload.to }, "SMS sent successfully")
  }
}
