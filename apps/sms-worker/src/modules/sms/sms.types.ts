export interface TSmsPayload {
  to: string
  body: string
}

export interface ISmsRepository {
  send(dto: TSmsPayload): Promise<void>
}
