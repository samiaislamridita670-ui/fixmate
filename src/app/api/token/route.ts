import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { signAccessToken } from "@/lib/token";

/**
 * Issues a JWT for the currently signed-in BetterAuth session.
 * The browser calls this same-origin endpoint before every Express API
 * request; no credentials ever cross the origin boundary.
 */
export async function GET() {
  // Read request headers OUTSIDE the try/catch: during prerendering this
  // promise rejects on purpose so React can abort the static render and mark
  // the route dynamic. Catching it here would break that contract.
  const headerList = await headers();

  try {
    const session = await auth.api.getSession({ headers: headerList });

    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const user = session.user as typeof session.user & { role?: string };

    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: String(user.role || "customer"),
    });

    return NextResponse.json({ success: true, token, expiresAt });
  } catch (error) {
    console.error("Token issue error:", error);
    return NextResponse.json(
      { success: false, message: "Could not issue access token." },
      { status: 500 }
    );
  }
}
