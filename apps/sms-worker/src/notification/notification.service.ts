import { FatalNotificationError } from "../shared/errors/app.error.js"
import { logger } from "../shared/logger/logger.js"
import type { ISmsRepository, SmsPayload } from "./notification.types.js"

export class SmsNotificationService {
  constructor(private readonly smsRepo: ISmsRepository) {}

  async process(messageId: string, payload: SmsPayload): Promise<void> {
    logger.info({ messageId, to: payload.to }, "Processing SMS notification")

    if (!payload.to || !payload.body) {
      throw new FatalNotificationError("Invalid SMS payload: missing required fields")
    }

    await this.smsRepo.send({ to: payload.to, body: payload.body })

    logger.info({ messageId, to: payload.to }, "SMS sent successfully")
  }
}
