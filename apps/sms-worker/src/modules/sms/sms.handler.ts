import { logger } from "../../infra/logger/logger.js"
import { FatalNotificationError } from "../../shared/errors/app.error.js"
import type { TSmsMessage } from "./sms.schema.js"
import { smsMessageSchema } from "./sms.schema.js"
import type { SmsNotificationService } from "./sms.service.js"

export class SmsNotificationHandler {
  constructor(private readonly service: SmsNotificationService) {}

  async handle(msg: TSmsMessage): Promise<void> {
    const parsed = smsMessageSchema.safeParse(msg)

    if (!parsed.success) {
      logger.error(
        { issues: parsed.error.issues, messageId: msg.messageId },
        "Invalid message schema — sending to DLQ immediately",
      )
      throw new FatalNotificationError("Invalid message schema")
    }

    const { messageId, payload } = parsed.data
    await this.service.process(messageId, payload)
  }
}
