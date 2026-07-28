import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Temporary landing spot right after login — the (family) and (provider)
// route groups (search/booking/chat, onboarding/KYC/payouts) are next on
// the build order, not built yet. This just proves auth + role assignment
// actually worked end to end.
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-text-primary">You&apos;re in.</h1>
      <p className="text-text-secondary">
        Signed in as <span className="font-medium text-text-primary">{user.phone}</span>
        {roleRow ? (
          <>
            {" "}
            (<span className="font-medium text-text-primary">{roleRow.role}</span>)
          </>
        ) : null}
      </p>
      <p className="text-sm text-text-secondary">
        The rest of the {roleRow?.role === "provider" ? "provider" : "family"} app isn&apos;t built yet — next up
        per the build order.
      </p>
    </main>
  );
}
