// Framework-agnostic business rules — the prototype's stand-in for
// packages/core, kept local per this build's own guardrail against
// building out the monorepo/shared-package structure prematurely
// (Guardrails, Section 2/9). Same numbers as the real backend's
// packages/core/src/commission.ts, so nothing has to change when this
// prototype's flows get wired to Supabase.
export const MIN_COMMISSION_RATE = 0.15;
export const DEFAULT_COMMISSION_RATE = 0.18;
