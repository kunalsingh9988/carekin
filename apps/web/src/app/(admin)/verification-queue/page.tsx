import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewProvider } from "./actions";

interface PendingProvider {
  provider_id: string;
  type: "caregiver" | "babysitter";
  bio: string | null;
  phone: string;
  created_at: string;
}

export default async function VerificationQueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // No standalone /login page anymore — login is the navbar's popup.
  if (!user) redirect("/");

  const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (roleRow?.role !== "admin") {
    redirect("/welcome");
  }

  // list_pending_providers() checks is_admin() itself too — this page's own
  // redirect above is a UX nicety, not the security boundary (Section 5.2).
  const { data: pending, error } = await supabase.rpc("list_pending_providers");

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary">Verification queue</h1>

      {error && <p className="text-danger">{error.message}</p>}
      {!error && pending?.length === 0 && <p className="text-text-secondary">No pending providers.</p>}

      <ul className="flex flex-col gap-4">
        {(pending as PendingProvider[] | null)?.map((p) => (
          <li key={p.provider_id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-text-primary">
                  {p.type === "caregiver" ? "Elder caregiver" : "Babysitter"} · {p.phone}
                </p>
                {p.bio && <p className="mt-1 text-sm text-text-secondary">{p.bio}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={reviewProvider}>
                  <input type="hidden" name="providerId" value={p.provider_id} />
                  <input type="hidden" name="status" value="approved" />
                  <button className="min-h-tap rounded-md bg-verified px-4 text-sm font-semibold text-white" type="submit">
                    Approve
                  </button>
                </form>
                <form action={reviewProvider}>
                  <input type="hidden" name="providerId" value={p.provider_id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button className="min-h-tap rounded-md bg-danger px-4 text-sm font-semibold text-white" type="submit">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
