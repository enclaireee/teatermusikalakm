// Referral discount shared by checkout and admin. The valid codes themselves live in Postgres
// (referral_codes); nothing here reveals them to the client bundle.

export const REFERRAL_DISCOUNT = 5000; // per ticket, on top of the active presale/normal price
export const REFERRAL_CODE_MAX = 32;

/** Trim + uppercase, so typing " nemubarengan " works. Codes are stored uppercase in Postgres. */
export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase();
}

/** Final unit price after the referral discount. Never negative. */
export function referralPrice(price: number | null, discount = REFERRAL_DISCOUNT): number | null {
  if (price === null) return null;
  return Math.max(0, price - Math.max(0, discount));
}
