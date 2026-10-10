import type { OrderStatus } from "@/lib/admin";

const CHIP = "type-caption inline-block whitespace-nowrap rounded-full border-2 px-2.5 py-0.5";

export const CHECK_STYLE = {
  belum: "border-border-subtle bg-bg-muted text-text-primary",
  valid: "border-border-brand bg-bg-brand-soft text-text-brand",
  tidak: "border-border-danger bg-bg-danger-soft text-text-danger",
} as const;

export type CheckKey = keyof typeof CHECK_STYLE;
export const CHECK_LABEL: Record<CheckKey, string> = { belum: "Belum dicek", valid: "Valid", tidak: "Tidak valid" };
export const checkKey = (c: boolean | null): CheckKey => (c === null ? "belum" : c ? "valid" : "tidak");

export function CheckChip({ checked }: { checked: boolean | null }) {
  const k = checkKey(checked);
  return <span className={`${CHIP} ${CHECK_STYLE[k]}`}>{CHECK_LABEL[k]}</span>;
}

export function BuyerChip({ status }: { status: OrderStatus }) {
  const ok = status === "valid";
  return (
    <span aria-label={`Status pembeli: ${ok ? "Valid" : "Batal"}`} className={`${CHIP} ${ok ? CHECK_STYLE.valid : CHECK_STYLE.tidak}`}>
      {ok ? "Valid" : "Batal"}
    </span>
  );
}

const WIB = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
export const formatWib = (iso: string | null) => (iso ? WIB.format(new Date(iso)) : "—");
export const METHOD_LABEL = { qris: "QRIS", transfer: "Transfer" } as const;

export function HargaChip({ presale }: { presale: boolean }) {
  return (
    <span
      aria-label={`Harga: ${presale ? "Presale" : "Normal"}`}
      className={`${CHIP} ${presale ? "border-border-default bg-bg-accent text-text-strong" : "border-border-subtle bg-bg-muted text-text-primary"}`}
    >
      {presale ? "Presale" : "Normal"}
    </span>
  );
}
