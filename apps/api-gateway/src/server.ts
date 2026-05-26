import cors from "@fastify/cors"
import fastifySwagger from "@fastify/swagger"
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "@fastify/type-provider-zod"
import fastifyApiReference from "@scalar/fastify-api-reference"
import fastify from "fastify"
import { notificationModule } from "./modules/notification/notification.module.js"
import { logger } from "./shared/logger/logger.js"
import { errorHandlerMiddleware } from "./shared/middlewares/error-handler.middleware.js"

export async function buildServer() {
  const app = fastify({ loggerInstance: logger })

  await app.register(cors, { origin: true })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "API Gateway",
        description: "Notification Gateway API Documentation",
        version: "1.0.0",
      },
    },
    transform: jsonSchemaTransform,
  })

  await app.register(fastifyApiReference, {
    routePrefix: "/docs",
    configuration: {
      theme: "purple",
      layout: "modern",
      darkMode: false,
    },
  })

  await app.register(notificationModule)

  app.setErrorHandler(errorHandlerMiddleware)

  return app
}
