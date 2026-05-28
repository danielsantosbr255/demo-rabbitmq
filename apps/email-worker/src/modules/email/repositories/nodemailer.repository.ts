import nodemailer from "nodemailer"
import { env } from "../../../infra/config/env.js"
import type { IEmailRepository, TEmailPayload } from "../email.types.js"

export class NodemailerEmailRepository implements IEmailRepository {
  private readonly transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      ignoreTLS: true,
      connectionTimeout: 5000,
      socketTimeout: 5000,
    })
  }

  async send(dto: TEmailPayload): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: dto.to,
      subject: dto.subject,
      text: dto.body,
    })
  }
}
