import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;

/** Access token lifetime shared by the Next.js issuer and Express verifier. */
export const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 hours

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Signs a short-lived HS256 JWT for a verified BetterAuth session user.
 * Express re-verifies the signature and re-reads the role from MongoDB,
 * so this token only proves identity — never client-claimed privileges.
 */
export function signAccessToken(user: AccessTokenPayload): {
  token: string;
  expiresAt: number;
} {
  if (!SECRET) {
    throw new Error("JWT_SECRET or BETTER_AUTH_SECRET is not configured.");
  }

  const token = jwt.sign(
    {
      sub: user.sub,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    SECRET,
    { algorithm: "HS256", expiresIn: TOKEN_TTL_SECONDS }
  );

  return { token, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 };
}
