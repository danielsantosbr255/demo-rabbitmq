export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly isFatal: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FatalNotificationError extends AppError {
  readonly code = 'FATAL_NOTIFICATION_ERROR';
  readonly isFatal = true;
}

export class TransientNotificationError extends AppError {
  readonly code = 'TRANSIENT_NOTIFICATION_ERROR';
  readonly isFatal = false;
}
