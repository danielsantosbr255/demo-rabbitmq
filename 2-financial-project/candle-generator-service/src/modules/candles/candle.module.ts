import { IMessage } from "../../infra/message/message.types.js"
import { Period, PriceApiResponse } from "./candle.types.js"
import { config } from "../../config/config.js"
import { CandleEntity } from "./candle.entity.js"

export const readMarketPrice = async (): Promise<number | null> => {
  try {
    const result = await fetch(`${config.priceApi}`)
    const data = await result.json() as PriceApiResponse

    if (data?.status?.error_message) {
      console.warn(`[API WARNING] ${data.status.error_message}`)
      return null
    }
    return data?.bitcoin?.usd ?? null
  } catch (error) {
    console.error(`[ERROR] Could not read market price.\n${error}`)
    return null
  }
}

export const generateCandle = async (rabbitMQ: IMessage) => {
  const loopTimes = Period.ONE_MINUTE / Period.TEN_SECONDS
  const candle = new CandleEntity("BTC")

  for (let i = 0; i < loopTimes; i++) {
    const price = await readMarketPrice()

    if (!price) {
      await new Promise((resolve) => setTimeout(resolve, Period.ONE_MINUTE))
      i--
      continue
    }
    candle.addValue(price)
    console.log(`Market price BTC: $${price}`)
    await new Promise((resolve) => setTimeout(resolve, Period.TEN_SECONDS))
  }

  candle.closeCandle()
  const simpleCandle = candle.toSimpleObject()
  console.log(simpleCandle)

  if (rabbitMQ) {
    await rabbitMQ.publishInQueue(config.rabbitmq.candleQueueName, simpleCandle)
  }
}