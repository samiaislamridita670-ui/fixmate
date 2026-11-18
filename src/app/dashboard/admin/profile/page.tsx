import { redirect } from "next/navigation";

/** Profile is shared by every role — single canonical route. */
export default function AdminProfileAliasPage() {
  redirect("/dashboard/profile");
}
