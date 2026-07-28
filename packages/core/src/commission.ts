// Never below 15% anywhere pricing logic lives (Section 2 guardrail). This
// is the one place that number is allowed to exist as a literal — everything
// else should import it.
export const MIN_COMMISSION_RATE = 0.15;
export const DEFAULT_COMMISSION_RATE = 0.18;

export function computeCommission(amountInPaise: number, rate: number = DEFAULT_COMMISSION_RATE): number {
  if (rate < MIN_COMMISSION_RATE) {
    throw new Error(`Commission rate ${rate} is below the platform minimum of ${MIN_COMMISSION_RATE}`);
  }
  return Math.round(amountInPaise * rate);
}

export function computeProviderPayout(amountInPaise: number, commissionInPaise: number): number {
  return amountInPaise - commissionInPaise;
}
