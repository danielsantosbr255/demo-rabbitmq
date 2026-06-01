import { beforeEach, describe, expect, it, vi } from "vitest"
import { QueueService } from "../src/modules/queues/queue.service.js"

// Mock the rabbitFetch module so no real HTTP calls are made
vi.mock("../src/shared/utils/rabbitmq.util.js", () => ({
  rabbitFetch: vi.fn(),
}))

import { rabbitFetch } from "../src/shared/utils/rabbitmq.util.js"

const mockFetch = vi.mocked(rabbitFetch)

function makeResponse(body: unknown, ok = true, statusText = "OK") {
  return {
    ok,
    statusText,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe("QueueService.getQueues()", () => {
  beforeEach(() => vi.clearAllMocks())

  it("should return mapped queues with serverTime", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse([
        {
          name: "q.notifications.email",
          messages: 3,
          messages_unacknowledged: 1,
          arguments: { "x-message-ttl": 86400000 },
          head_message_timestamp: 1716400000000,
        },
        {
          name: "q.notifications.sms",
          messages: 0,
          messages_unacknowledged: 0,
          arguments: {},
          head_message_timestamp: undefined,
        },
      ]),
    )

    const service = new QueueService()
    const result = await service.getQueues()

    expect(result.queues).toHaveLength(2)
    expect(result.queues[0]).toMatchObject({
      name: "q.notifications.email",
      messages: 3,
      messagesUnacked: 1,
      ttl: 86400000,
      headTimestamp: 1716400000000,
    })
    expect(result.queues[1]).toMatchObject({
      name: "q.notifications.sms",
      messages: 0,
      messagesUnacked: 0,
      ttl: null,
      headTimestamp: null,
    })
    expect(typeof result.serverTime).toBe("number")
  })

  it("should return empty queues array when RabbitMQ has no queues", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse([]))

    const service = new QueueService()
    const result = await service.getQueues()

    expect(result.queues).toHaveLength(0)
    expect(result.serverTime).toBeGreaterThan(0)
  })

  it("should throw an error when RabbitMQ API responds with non-ok status", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(null, false, "Unauthorized"))

    const service = new QueueService()

    await expect(service.getQueues()).rejects.toThrow("RabbitMQ API: Unauthorized")
  })
})

describe("QueueService.getDlq()", () => {
  beforeEach(() => vi.clearAllMocks())

  it("should return DLQ messages from the API", async () => {
    const fakeDlqMessages = [{ payload: '{"channel":"email"}', redelivered: true, routing_key: "q.notifications.dlq" }]
    mockFetch.mockResolvedValueOnce(makeResponse(fakeDlqMessages))

    const service = new QueueService()
    const result = await service.getDlq()

    expect(result).toEqual(fakeDlqMessages)
  })

  it("should throw when DLQ API returns an error", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(null, false, "Internal Server Error"))

    const service = new QueueService()

    await expect(service.getDlq()).rejects.toThrow("RabbitMQ API: Internal Server Error")
  })
})

describe("QueueService.deleteDlq()", () => {
  beforeEach(() => vi.clearAllMocks())

  it("should return { ok: true } on successful purge", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(null, true))

    const service = new QueueService()
    const result = await service.deleteDlq()

    expect(result).toEqual({ ok: true })
  })

  it("should throw when DLQ purge API returns an error", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(null, false, "Forbidden"))

    const service = new QueueService()

    await expect(service.deleteDlq()).rejects.toThrow("RabbitMQ API: Forbidden")
  })
})
