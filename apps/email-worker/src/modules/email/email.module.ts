import { NodemailerEmailRepository } from "./adapters/nodemailer-email.repository.js"
import { EmailNotificationService } from "./email.service.js"

export function createEmailNotificationService(): EmailNotificationService {
  const repository = new NodemailerEmailRepository()
  return new EmailNotificationService(repository)
}
