import { logger } from "../../infra/logger/logger.js"
import { FatalNotificationError } from "./email.errors.js"
import type { EmailPayload, IEmailRepository } from "./email.types.js"

export class EmailNotificationService {
  constructor(private readonly repository: IEmailRepository) {}

  async process(messageId: string, payload: EmailPayload): Promise<void> {
    logger.info({ messageId, to: payload.to }, "Processing email notification")
    this.validatePayload(payload)

    await this.repository.send({
      to: payload.to,
      subject: payload.subject,
      body: payload.body,
    })

    logger.info({ messageId, to: payload.to }, "Email sent successfully")
  }

  private validatePayload(payload: EmailPayload): void {
    if (!payload.to || !payload.subject) {
      throw new FatalNotificationError("Invalid payload: missing required fields")
    }
  }
}
