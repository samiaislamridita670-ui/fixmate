import { redirect } from "next/navigation";

/** Legacy technician services URL — now under /dashboard/technician/my-services. */
export default function LegacyTechnicianServicesPage() {
  redirect("/dashboard/technician/my-services");
}
