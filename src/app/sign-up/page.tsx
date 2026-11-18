import { redirect } from "next/navigation";

/** BetterAuth-style alias: /sign-up → /register */
export default function SignUpAlias() {
  redirect("/register");
}
