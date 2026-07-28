"use server";

import { revalidatePath } from "next/cache";
import { ReviewVerificationInput } from "@carekin/validation";
import { createClient } from "@/lib/supabase/server";

export async function reviewProvider(formData: FormData) {
  const parsed = ReviewVerificationInput.safeParse({
    providerId: formData.get("providerId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const supabase = await createClient();
  // review_verification() checks is_admin() itself and raises if not — this
  // Server Action doesn't need its own admin check, the database is the
  // actual boundary (Section 5.2).
  const { error } = await supabase.rpc("review_verification", {
    p_provider_id: parsed.data.providerId,
    p_new_status: parsed.data.status,
    p_notes: parsed.data.notes ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/verification-queue");
}
