import { redirect } from "next/navigation";

/** Profile is shared by every role — single canonical route. */
export default function TechnicianProfileAliasPage() {
  redirect("/dashboard/profile");
}
