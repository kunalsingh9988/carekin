import { redirect } from "next/navigation";

// No standalone admin dashboard — the console's real home is the
// verification queue.
export default function AdminIndexPage() {
  redirect("/admin/verification-queue");
}
