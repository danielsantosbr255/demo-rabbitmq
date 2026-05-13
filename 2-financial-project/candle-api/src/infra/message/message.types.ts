export interface IMessage {
  publishInQueue(queue: string, message: any): Promise<boolean>
  publishInExchange(exchange: string, routingKey: string, message: any): Promise<boolean>
  consumeQueue(queue: string, callback: (message: any) => void): Promise<void>
}
