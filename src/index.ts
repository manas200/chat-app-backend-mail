import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config();

startSendOtpConsumer();

const app = express();
console.log("🔁 Source file: src/index.ts running...");

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
