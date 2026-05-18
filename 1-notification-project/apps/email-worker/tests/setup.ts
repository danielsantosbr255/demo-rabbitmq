// Set required env vars before any module imports
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error';
process.env['RABBITMQ_URL'] = 'amqp://admin:admin@localhost:5672';
process.env['SMTP_HOST'] = 'localhost';
process.env['SMTP_PORT'] = '1025';
process.env['EMAIL_FROM'] = 'test@example.com';
process.env['MAX_RETRIES'] = '3';
process.env['PREFETCH_COUNT'] = '1';
