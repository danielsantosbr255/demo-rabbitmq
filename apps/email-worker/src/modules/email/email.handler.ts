import { logger } from "../../infra/logger/logger.js"
import { FatalNotificationError } from "./email.errors.js"
import type { TEmailMessage } from "./email.schema.js"
import { emailMessageSchema } from "./email.schema.js"
import type { EmailNotificationService } from "./email.service.js"

export class EmailNotificationHandler {
  constructor(private readonly service: EmailNotificationService) {}

  async handle(msg: TEmailMessage): Promise<void> {
    const parsed = emailMessageSchema.safeParse(msg)

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
