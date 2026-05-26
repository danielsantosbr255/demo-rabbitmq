export interface EmailPayload {
  to: string
  subject: string
  body: string
}

export interface SendEmailDto {
  to: string
  subject: string
  body: string
}

export interface IEmailRepository {
  send(dto: SendEmailDto): Promise<void>
}
