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
  database: mongodbAdapter(client.db()),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
