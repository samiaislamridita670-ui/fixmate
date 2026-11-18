import { redirect } from "next/navigation";

/** Legacy admin panel URL — the admin area now lives under /dashboard/admin. */
export default function LegacyAdminPage() {
  redirect("/dashboard/admin");
}
