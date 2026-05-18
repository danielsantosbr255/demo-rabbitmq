export interface PushPayload {
  deviceToken: string;
  title: string;
  body: string;
}

export interface SendPushDto {
  deviceToken: string;
  title: string;
  body: string;
}

export interface IPushRepository {
  send(dto: SendPushDto): Promise<void>;
}
