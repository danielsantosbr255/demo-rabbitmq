export interface SmsPayload {
  to: string;
  body: string;
}

export interface SendSmsDto {
  to: string;
  body: string;
}

export interface ISmsRepository {
  send(dto: SendSmsDto): Promise<void>;
}
