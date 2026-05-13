import { connect, type Channel, type ChannelModel } from 'amqplib';
import { config } from '../../config/config.js';
import { type IMessage } from './message.types.js';

class RabbitMQClient implements IMessage {
  private connection?: ChannelModel;
  private channel?: Channel;
  public static instance: RabbitMQClient;

  private constructor(private readonly uri: string) { }

  public static getInstance(uri: string): RabbitMQClient {
    if (!RabbitMQClient.instance) {
      RabbitMQClient.instance = new RabbitMQClient(uri);
    }
    return RabbitMQClient.instance;
  }

  async connect(): Promise<Channel> {
    this.connection = await connect(this.uri);
    return this.channel = await this.connection.createChannel();
  }

  async publishInQueue(queue: string, message: any): Promise<boolean> {
    if (!this.channel) this.channel = await this.connect();
    return this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async publishInExchange(exchange: string, routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) this.channel = await this.connect();
    await this.createExchange(exchange);
    return this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async createQueue(queue: string): Promise<void> {
    if (!this.channel) this.channel = await this.connect();
    await this.channel.assertQueue(queue);
  }

  async createExchange(exchange: string, type: string = 'direct'): Promise<void> {
    if (!this.channel) this.channel = await this.connect();
    await this.channel.assertExchange(exchange, type);
  }

  async bindQueue(queue: string, exchange: string, pattern: string): Promise<void> {
    if (!this.channel) this.channel = await this.connect();
    await this.channel.bindQueue(queue, exchange, pattern);
  }

  async consumeQueue(queue: string, callback: (message: any) => void): Promise<void> {
    if (!this.channel) this.channel = await this.connect();
    this.channel.consume(queue, (msg) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        this.channel?.ack(msg);
      }
    });
  }
}

export const rabbitMQ = RabbitMQClient.getInstance(config.rabbitmq.uri!);
