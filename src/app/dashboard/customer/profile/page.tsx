import { redirect } from "next/navigation";

/** Profile is shared by every role — single canonical route. */
export default function CustomerProfileAliasPage() {
  redirect("/dashboard/profile");
}
