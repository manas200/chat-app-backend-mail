import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config();

const app = express();

app.get("/", (_, res) => {
  res.send("✅ Mail service alive");
});

app.listen(process.env.PORT, () => {
  console.log(`🌐 Mail service running on port ${process.env.PORT}`);

  startSendOtpConsumer();
});
