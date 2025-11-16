import amqp from "amqplib";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

import { exec } from "child_process";

// Function to log disk usage
const logDiskUsage = () => {
  // This command finds the top 5 largest files/folders
  // and also shows the main disk's total usage.
  const command = "df -h && du -h / | sort -rh | head -5";

  exec(command, (error, stdout, stderr) => {
    console.log("--- 🔎 START DISK USAGE REPORT ---");
    if (error) {
      console.error(`exec error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    // This will print the full report to your Render Logs
    console.log(stdout);

    console.log("--- 🛑 END DISK USAGE REPORT ---");
  });
};

// --- Your Mail Service/RabbitMQ code starts here ---
// e.g., connectToRabbitMQ();

// Safely set SendGrid API key without crashing if missing
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error(
    "⚠️ SENDGRID_API_KEY not defined. Mailer disabled; consumer will still run and log messages."
  );
} else {
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log("✅ SendGrid API key configured");
  } catch (err) {
    console.error("❌ Failed to set SendGrid API key:", err);
  }
}

export const startSendOtpConsumer = async () => {
  try {
    const CLOUDAMQP_URL = process.env.CLOUDAMQP_URL;
    const EMAIL_FROM = process.env.EMAIL_FROM;

    if (!process.env.SENDGRID_API_KEY) {
      console.error(
        "⚠️ SENDGRID_API_KEY missing. Emails will NOT be sent. Set this env to enable delivery."
      );
    }

    if (!CLOUDAMQP_URL) throw new Error("CLOUDAMQP_URL not defined");
    if (!EMAIL_FROM) throw new Error("EMAIL_FROM not defined");

    console.log("CLOUDAMQP_URL:", CLOUDAMQP_URL);

    const connection = await amqp.connect(CLOUDAMQP_URL);
    const channel = await connection.createChannel(); // Limit unacked messages to avoid memory pressure

    await channel.prefetch(5);

    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });

    console.log(
      `✅ Mail Service consumer started, listening for queue "${queueName}"`
    );

    connection.on("error", (err) =>
      console.error("RabbitMQ connection error:", err)
    );
    connection.on("close", () => {
      console.warn("RabbitMQ connection closed. Reconnecting...");
      setTimeout(startSendOtpConsumer, 5000);
    });

    channel.consume(
      queueName,
      async (msg) => {
        console.log("📩 Message received");

        if (msg) {
          try {
            const content = msg.content.toString();
            console.log("📄 Message content:", content);

            const { to, subject, body } = JSON.parse(content);

            if (!to || !subject || !body) {
              throw new Error("Missing email fields");
            }

            if (!SENDGRID_API_KEY) {
              // Drop the message if we can't send emails to avoid infinite retries
              console.error(
                "❌ Cannot send email: SENDGRID_API_KEY not set. Dropping message.",
                { to, subject }
              );
              channel.nack(msg, false, false);
              return;
            }

            const message: sgMail.MailDataRequired = {
              to,
              from: EMAIL_FROM,
              subject,
              text: body,
            };

            const response = await sgMail.send(message);
            console.log(`✅ OTP mail sent to ${to}`, response[0].statusCode);

            channel.ack(msg);
          } catch (error: any) {
            console.error(
              "❌ Failed to send OTP:",
              error.response?.body || error
            );
            channel.nack(msg, false, false); // Don't requeue if failure is permanent
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("❌ Failed to start RabbitMQ consumer", error);
    setTimeout(startSendOtpConsumer, 5000); // Retry connection
  }
};

// Log usage right at the start
logDiskUsage();

// Also log usage every hour to see how it grows
setInterval(logDiskUsage, 3600000); // 3600000 ms = 1 hour
