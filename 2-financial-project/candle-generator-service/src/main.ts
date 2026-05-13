import { rabbitMQ } from "./infra/message/rabbitmq.js"
import { generateCandle } from "./modules/candles/candle.module.js"
import { config } from "./config/config.js"

async function bootstrap() {
  await rabbitMQ.connect()
  await rabbitMQ.createQueue(config.rabbitmq.candleQueueName)

  while (true) {
    await generateCandle(rabbitMQ)
  }
}

bootstrap()
