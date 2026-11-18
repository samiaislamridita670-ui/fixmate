import mongoose from "mongoose";

/**
 * Keeps legacy BetterAuth collections compatible with `usePlural: true`.
 *
 * Older databases stored auth data in singular collections (`user`,
 * `session`, `account`, `verification`). When plural collections do not
 * exist yet but singular ones do, they are renamed in place — no data is
 * dropped or overwritten. Runs idempotently on every server start.
 */
const PAIRS: Array<[string, string]> = [
  ["user", "users"],
  ["session", "sessions"],
  ["account", "accounts"],
  ["verification", "verifications"],
];

export async function migrateAuthCollections(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const existing = await db.listCollections().toArray();
  const names = new Set(existing.map((collection) => collection.name));

  for (const [legacy, plural] of PAIRS) {
    if (names.has(legacy) && !names.has(plural)) {
      await db.collection(legacy).rename(plural);
      console.log(`Migrated auth collection "${legacy}" -> "${plural}".`);
    }
  }
}
