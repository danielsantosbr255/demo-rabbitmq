import nodemailer from 'nodemailer';
import type { IEmailRepository, SendEmailDto } from './notification.types.js';
import { env } from '../shared/config/env.js';

export class NodemailerEmailRepository implements IEmailRepository {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      ignoreTLS: true,
    });
  }

  async send(dto: SendEmailDto): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: dto.to,
      subject: dto.subject,
      text: dto.body,
    });
  }
}
