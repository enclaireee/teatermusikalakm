// Adds (or re-activates) one referral code without a deploy.
// Run: node --env-file=.env.local --experimental-strip-types scripts/add-referral-code.ts KODE "Nama Komunitas" [max_uses]
// max_uses is optional; leave it out for unlimited use.
import { createClient } from "@supabase/supabase-js";
import { normalizeReferralCode, REFERRAL_CODE_MAX } from "../lib/referral.ts";

const [rawCode, label, rawMax] = process.argv.slice(2);
const code = rawCode ? normalizeReferralCode(rawCode) : "";
if (!code || !/^[A-Z0-9-]{3,32}$/.test(code) || code.length > REFERRAL_CODE_MAX || !label?.trim()) {
  console.error('Usage: node --env-file=.env.local --experimental-strip-types scripts/add-referral-code.ts KODE "Nama Komunitas" [max_uses]');
  process.exit(1);
}

const maxUses = rawMax === undefined ? null : Number(rawMax);
if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
  console.error("max_uses must be a positive whole number (or omitted).");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set (copy .env.example to .env.local).");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const { error } = await db
  .from("referral_codes")
  .upsert({ code, label: label.trim(), max_uses: maxUses, is_active: true }, { onConflict: "code" });
if (error) {
  console.error(`Failed: ${error.message}`);
  process.exit(1);
}
console.log(`Referral ${code} is active${maxUses === null ? " (unlimited)" : ` (max ${maxUses} paid orders)`}.`);
