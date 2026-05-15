import express from "express"
import { config } from "./shared/config/config"
import { RabbitMQClient } from "./infra/message/rabbitmq"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.listen(config.port, async () => {
    console.log("Server running on port ", config.port)

    const rabbitMQ = new RabbitMQClient(config.rabbitmq.uri!)
    await rabbitMQ.connect()
})

