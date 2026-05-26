import { NodemailerEmailRepository } from "./adapters/nodemailer-email.repository.js";
import { RabbitMQEmailConsumer } from "./adapters/rabbitmq-email.consumer.js";
import { EmailNotificationService } from "./email.service.js";

export async function startEmailWorker() {
  const repository = new NodemailerEmailRepository();
  const service = new EmailNotificationService(repository);
  const consumer = new RabbitMQEmailConsumer(service);
  await consumer.start();
  return consumer;
}
