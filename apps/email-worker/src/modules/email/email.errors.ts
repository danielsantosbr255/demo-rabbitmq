import { AppError } from "../../shared/errors/app.error.js"

export class FatalNotificationError extends AppError {
  readonly code = "FATAL_NOTIFICATION_ERROR"
  readonly isFatal = true
  readonly statusCode = 400
}

export class TransientNotificationError extends AppError {
  readonly code = "TRANSIENT_NOTIFICATION_ERROR"
  readonly isFatal = false
  readonly statusCode = 500
}
