import "dotenv/config";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const secret = process.env.BETTER_AUTH_SECRET;

if (!uri || !secret) {
  throw new Error("MONGODB_URI or BETTER_AUTH_SECRET is missing from server/.env");
}

const client = new MongoClient(uri);

export const auth = betterAuth({
  database: mongodbAdapter(client.db("fixmate")),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  secret,
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      role: {
        type: ["customer", "technician"],
        required: true,
        defaultValue: "customer",
        input: true
      },
      phone: {
        type: "string",
        required: false,
        input: true
      },
      area: {
        type: "string",
        required: false,
        input: true
      },
      bio: {
        type: "string",
        required: false,
        input: true
      }
    }
  },
  trustedOrigins: ["http://localhost:3001"]
});

