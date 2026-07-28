export type VerificationStatus = "pending" | "approved" | "rejected";

// A provider is queryable/bookable by families under exactly one condition
// (Section 1/2 guardrail). This function is the single place that decision
// gets made in application code — everything else (RLS included) should
// agree with it, not reimplement it.
export function isProviderVisible(status: VerificationStatus): boolean {
  return status === "approved";
}

// Only PENDING can move to approved/rejected. A rejected or approved
// decision is terminal from the automated-flow's perspective — reopening
// one requires a fresh review cycle initiated deliberately by an admin
// (modeled as a new row, not a transition), not a silent status flip.
export function canTransitionVerification(from: VerificationStatus, to: VerificationStatus): boolean {
  return from === "pending" && (to === "approved" || to === "rejected");
}
