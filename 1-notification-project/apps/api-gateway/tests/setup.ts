// Set required env vars before any module imports
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';
process.env['PORT'] = '3000';
process.env['HOST'] = '0.0.0.0';
process.env['RABBITMQ_URL'] = 'amqp://admin:admin@localhost:5672';
