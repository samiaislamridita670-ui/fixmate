import jwt from "jsonwebtoken";

/**
 * Access-token verification for the Express API.
 *
 * Tokens are issued by the Next.js `/api/token` route (HS256) after the
 * BetterAuth session cookie has been verified server-side. Express checks
 * the signature here, then re-reads the user's role from MongoDB — the
 * role claim inside the token is never trusted for authorization.
 */
const SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;

export interface VerifiedToken {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export function verifyAccessToken(authorizationHeader?: string): VerifiedToken {
  if (!SECRET) {
    throw new Error("JWT_SECRET or BETTER_AUTH_SECRET is not configured.");
  }

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Missing bearer token.");
  }

  const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;

  if (!payload || typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Invalid token payload.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : "",
    role: typeof payload.role === "string" ? payload.role : "customer",
  };
}
