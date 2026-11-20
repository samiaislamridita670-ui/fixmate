import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { setServers } from "node:dns";

setServers(["8.8.8.8", "1.1.1.1"]);

const uri = process.env.MONGODB_URI;
const secret = process.env.BETTER_AUTH_SECRET;

if (!uri || !secret) {
  throw new Error("MONGODB_URI or BETTER_AUTH_SECRET is missing from .env.local");
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
};

const client = globalForMongo.mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = client;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  database: mongodbAdapter(client.db("fixmate"), { usePlural: true }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {}),
    ...(githubClientId && githubClientSecret
      ? { github: { clientId: githubClientId, clientSecret: githubClientSecret } }
      : {}),
  },
  user: {
    additionalFields: {
      role: {
        type: ["customer", "technician", "admin"],
        required: true,
        defaultValue: "customer",
        input: true,
      },
      phone: { type: "string", required: false, input: true },
      area: { type: "string", required: false, input: true },
      bio: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = String((user as { role?: string }).role || "customer");
          const safeRole = role === "technician" ? "technician" : "customer";
          return { data: { ...user, role: safeRole } };
        },
      },
    },
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
});




