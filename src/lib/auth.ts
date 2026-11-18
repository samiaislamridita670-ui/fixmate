import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing");
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
};

const client = globalForMongo.mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = client;
}

export const auth = betterAuth({
  database: mongodbAdapter(client.db(), { usePlural: true }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6
  },
  user: {
    additionalFields: {
      role: {
        type: ["customer", "technician", "admin"],
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
  databaseHooks: {
    user: {
      create: {
        // BetterAuth expects this hook to return a Promise; `async` provides it
        // while keeping the same sanitising behaviour as before.
        before: async (user) => {
          // Self-registration may only ever produce customer or technician.
          // Admin accounts are promoted by an existing admin at runtime.
          const role = String((user as { role?: string }).role || "customer");
          const safeRole = role === "technician" ? "technician" : "customer";
          return { data: { ...user, role: safeRole } };
        }
      }
    }
  },
  trustedOrigins: ["http://localhost:3001"]
});
