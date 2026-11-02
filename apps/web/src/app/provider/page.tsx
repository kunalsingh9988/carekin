import { redirect } from "next/navigation";

// No standalone provider landing — the real home is bookings.
export default function ProviderIndexPage() {
  redirect("/provider/bookings");
}
