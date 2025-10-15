import express from "express";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (_, res) => {
  res.send("✅ Mail service alive");
});

// Simple direct-send test endpoint to validate SendGrid configuration
app.post("/send-test", async (req, res) => {
  const { to, subject = "Pulse Chat OTP Test", body = "Hello from Pulse Chat" } = req.body;
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return res.status(400).json({
      message: "Missing SENDGRID_API_KEY or EMAIL_FROM env variables",
    });
  }

  try {
    sgMail.setApiKey(apiKey);
    const resp = await sgMail.send({ to, from, subject, text: body });
    return res.json({ message: "Email sent", statusCode: resp[0].statusCode });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to send test email",
      error: err.response?.body || err.message || err,
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🌐 Mail service running on port ${PORT}`);
  startSendOtpConsumer();
});
