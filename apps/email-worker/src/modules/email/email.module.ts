import { EmailNotificationService } from "./email.service.js"
import { NodemailerEmailRepository } from "./repositories/nodemailer.repository.js"

export function createEmailNotificationService(): EmailNotificationService {
  const repository = new NodemailerEmailRepository()
  return new EmailNotificationService(repository)
}
