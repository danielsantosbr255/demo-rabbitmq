export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly isFatal: boolean
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}
