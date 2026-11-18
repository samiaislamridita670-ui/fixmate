import { redirect } from "next/navigation";

/** BetterAuth-style alias: /sign-in → /login */
export default function SignInAlias() {
  redirect("/login");
}
