export type ConsumerOptions<T = object> = {
  channel: string
  prefetch: number
  maxRetries: number
  retryDelays: number[]
  handler: (msg: T) => Promise<void>
}
