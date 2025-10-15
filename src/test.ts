import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  const connection = await amqp.connect(process.env.CLOUDAMQP_URL!);
  const channel = await connection.createChannel();

  const queueName = "send-otp";
  await channel.assertQueue(queueName, { durable: true });

  const message = {
    to: "test@example.com",
    subject: "Test OTP",
    body: "This is a test OTP",
  };

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });

  console.log(`📨 Sent test message to "${queueName}"`);
  process.exit();
})();
