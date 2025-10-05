import amqp from "amqplib";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const startSendOtpConsumer = async () => {
  try {
    console.log("CLOUDAMQP_URL:", process.env.CLOUDAMQP_URL);

    const connection = await amqp.connect(process.env.CLOUDAMQP_URL as string);
    const channel = await connection.createChannel();

    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });

    console.log("✅ Mail Service consumer started, listening for otp emails");

    channel.consume(queueName, async (msg) => {
      console.log("📩 Message received");

      if (msg) {
        try {
          console.log("📄 Message content:", msg.content.toString());

          const { to, subject, body } = JSON.parse(msg.content.toString());

          if (!to || !subject || !body) {
            throw new Error("Missing email fields");
          }

          const message: sgMail.MailDataRequired = {
            to: to,
            from: process.env.EMAIL_FROM!, // must be verified in SendGrid
            subject: subject,
            text: body,
          };

          const response = await sgMail.send(message);
          console.log(`✅ OTP mail sent to ${to}`, response[0].statusCode);

          channel.ack(msg);
        } catch (error: any) {
          console.error("❌ Failed to send otp", error.response?.body || error);
          channel.ack(msg); // prevents endless retry loop
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to start RabbitMQ consumer", error);
  }
};
