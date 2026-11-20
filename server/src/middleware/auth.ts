import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { findUserById, findUserByEmail, type AppUserRecord } from "../lib/users.js";

export interface AuthRequest extends Request {
  user?: AppUserRecord;
}

/**
 * Verifies the HS256 bearer token issued by `/api/token`, then re-reads
 * the user from MongoDB so authorization always reflects the current
 * database role (a demoted admin loses access immediately).
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenUser = verifyAccessToken(req.headers.authorization);

    const user = (await findUserById(tokenUser.sub)) || (await findUserByEmail(tokenUser.email));

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account no longer exists. Please sign in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT VERIFICATION ERROR:", error);
    const message =
      error instanceof Error && /expired/i.test(error.message)
        ? "Your session has expired. Please sign in again."
        : "Please sign in to continue.";
    return res.status(401).json({ success: false, message, diagnostic: error instanceof Error ? error.message : String(error) });
  }
};

/** Role gate applied after verifyToken. */
const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }
    next();
  };

export const verifyCustomer = [verifyToken, requireRole("customer")];
export const verifyTechnician = [verifyToken, requireRole("technician")];
export const verifyAdmin = [verifyToken, requireRole("admin")];

/** Any signed-in user. */
export const requireAuth = verifyToken;

/** Legacy role gate (kept so existing route wiring stays valid). */
export const allowRoles = requireRole;




