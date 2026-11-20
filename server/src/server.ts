import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import servicesRouter from "./routes/services.js";
import bookingsRouter from "./routes/bookings.js";
import paymentsRouter, { stripeWebhook } from "./routes/payments.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
import { migrateAuthCollections } from "./lib/migrate.js";


const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.CLIENT_URL].filter((origin): origin is string => Boolean(origin))
  : [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:3000", "http://localhost:3001"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Stripe webhook must receive the raw request body.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "6mb" }));

app.use("/api/services", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);

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

    // Rename legacy singular BetterAuth collections when needed (idempotent).
    try {
      await migrateAuthCollections();
    } catch (migrationError) {
      console.error("Auth collection migration skipped:", migrationError);
    }

    app.listen(PORT, () => {
      console.log(`FixMate API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();






