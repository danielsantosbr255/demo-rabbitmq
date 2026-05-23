import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../logger/logger.js';

export const errorHandlerMiddleware = (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): FastifyReply => {
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
    });
  }

  logger.error({ err: error }, 'Unhandled error');
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: error.message,
  });
};
