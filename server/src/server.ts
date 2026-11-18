import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import servicesRouter from "./routes/services.js";
import bookingsRouter from "./routes/bookings.js";
import paymentsRouter, { stripeWebhook } from "./routes/payments.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3001",
  credentials: true
}));

// Stripe webhook must receive the raw request body.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "6mb" }));

app.use("/api/services", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Welcome to FixMate API",
    version: "1.0.0"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: mongoose.connection.readyState === 1 ? "healthy" : "database disconnected",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    service: "FixMate Backend"
  });
});

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`FixMate API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
