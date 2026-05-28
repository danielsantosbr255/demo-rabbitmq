export type TEmailPayload = {
  to: string
  subject: string
  body: string
}

export interface IEmailRepository {
  send(payload: TEmailPayload): Promise<void>
}
