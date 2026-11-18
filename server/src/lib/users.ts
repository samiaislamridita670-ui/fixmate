import mongoose from "mongoose";

/**
 * Reads an application user straight from the BetterAuth `users`
 * collection. Authorization always uses the role stored in the database —
 * never a role claim carried by the client or embedded in a token.
 */
export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  area?: string;
  bio?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function usersCollection() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database is not connected.");
  return db.collection("users");
}

function normalize(doc: Record<string, unknown> | null): AppUserRecord | null {
  if (!doc) return null;
  const email = typeof doc.email === "string" ? doc.email : "";
  if (!email) return null;

  const rawRole = typeof doc.role === "string" ? doc.role : "customer";
  const role = ["customer", "technician", "admin"].includes(rawRole) ? rawRole : "customer";

  return {
    id: String(doc._id),
    name: typeof doc.name === "string" ? doc.name : "",
    email,
    role,
    phone: typeof doc.phone === "string" ? doc.phone : undefined,
    area: typeof doc.area === "string" ? doc.area : undefined,
    bio: typeof doc.bio === "string" ? doc.bio : undefined,
    image: typeof doc.image === "string" ? doc.image : undefined,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : undefined,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : undefined,
  };
}

export async function findUserById(id: string): Promise<AppUserRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await usersCollection().findOne({ _id: new mongoose.Types.ObjectId(id) });
  return normalize(doc as Record<string, unknown> | null);
}

export async function findUserByEmail(email: string): Promise<AppUserRecord | null> {
  const doc = await usersCollection().findOne({ email: email.toLowerCase().trim() });
  return normalize(doc as Record<string, unknown> | null);
}

export async function listUsers(): Promise<AppUserRecord[]> {
  const docs = await usersCollection().find({}).sort({ createdAt: -1 }).toArray();
  return docs
    .map((doc) => normalize(doc as unknown as Record<string, unknown>))
    .filter((user): user is AppUserRecord => user !== null);
}

export async function updateUserProfile(
  id: string,
  updates: { name?: string; phone?: string; area?: string; bio?: string; image?: string }
): Promise<AppUserRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) set.name = updates.name;
  if (updates.phone !== undefined) set.phone = updates.phone;
  if (updates.area !== undefined) set.area = updates.area;
  if (updates.bio !== undefined) set.bio = updates.bio;
  if (updates.image !== undefined) set.image = updates.image;

  const doc = await usersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: set },
    { returnDocument: "after" }
  );

  return normalize(doc as unknown as Record<string, unknown> | null);
}

export async function updateUserRole(id: string, role: string): Promise<AppUserRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  if (!["customer", "technician", "admin"].includes(role)) return null;

  const doc = await usersCollection().findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return normalize(doc as unknown as Record<string, unknown> | null);
}
