"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref } from "@/components/checkout/shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Quantity } from "@/components/ui/quantity";
import { useBooking } from "@/lib/booking";
import { MAX_TICKETS, SHOWS } from "@/lib/event";

const FORM_ID = "data-diri-form";
type Key = "name" | "email" | "phone" | "org" | "agree";
type Errors = Partial<Record<Key, string>>;
const ORDER: Key[] = ["name", "email", "phone", "agree"];

function check(k: Key, v: { name: string; email: string; phone: string; agree: boolean }): string | undefined {
  if (k === "name") return v.name.trim().length < 2 ? "Nama wajib diisi" : undefined;
  if (k === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()) ? undefined : "Format email belum benar, contoh: nama@email.com";
  if (k === "phone") {
    const p = v.phone.replace(/[\s-]/g, "");
    return /^(08|\+628)\d+$/.test(p) && p.replace(/\D/g, "").length >= 10 && p.replace(/\D/g, "").length <= 15 ? undefined : "Nomor WhatsApp belum valid, contoh: 0812-3456-7890";
  }
  if (k === "agree") return v.agree ? undefined : "Centang dulu untuk lanjut.";
}

export default function DataDiriPage() {
  const { booking, ready, reset } = useBooking();
  const finished = !!booking.code;
  useEffect(() => {
    if (ready && finished) reset(); // a finished order starts a new one
  }, [ready, finished, reset]);
  if (!ready || finished) return null;
  return <Form />;
}

function Form() {
  const { show, booking, update } = useBooking();
  const router = useRouter();
  const b = booking.buyer;
  const [name, setName] = useState(b?.name ?? "");
  const [email, setEmail] = useState(b?.email ?? "");
  const [phone, setPhone] = useState(b?.phone ?? "");
  const [org, setOrg] = useState(b?.org ?? "");
  const [qty, setQty] = useState(booking.qty);
  const [agree, setAgree] = useState(!!b);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const values = { name, email, phone, agree };

  const validate = (k: Key, over: Partial<typeof values> = {}) => setErrors((e) => ({ ...e, [k]: check(k, { ...values, ...over }) }));
  const count = Object.values(errors).filter(Boolean).length;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    for (const k of ORDER) next[k] = check(k, values);
    setErrors(next);
    setSubmitted(true);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    update({ buyer: { name: name.trim(), email: email.trim(), phone: phone.trim(), org: org.trim() }, qty, seats: booking.seats.slice(0, qty) });
    router.push(stepHref(show, 2));
  }

  return (
    <CheckoutShell
      step={1}
      aside={<OrderSummary />}
      bottomBar={<BottomBar info={`${SHOWS[show].label} · ${qty} tiket`} cta={{ label: "Lanjut Pilih Kursi", type: "submit", form: FORM_ID }} />}
    >
      <CheckoutCard>
        <form id={FORM_ID} noValidate onSubmit={onSubmit} className="flex flex-col gap-5 lg:gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="type-h2 text-text-brand">Data pemesan</h1>
            <p className="type-body-m text-text-secondary">E-receipt dan e-tiket dikirim ke email & WhatsApp ini, jadi pastikan benar ya.</p>
          </div>
          {submitted && count > 0 && <Alert type="error" title={`Ada ${count} data yang perlu dicek`}>Perbaiki kolom bertanda merah, lalu lanjut lagi.</Alert>}
          <Field id="f-name" label="Nama lengkap" required helper="Sesuai kartu identitas (KTP/KTM)" placeholder="Contoh: Dinda Aulia" autoComplete="name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} onBlur={() => validate("name")} />
          <Field id="f-email" label="Email" required type="email" inputMode="email" helper="E-receipt dikirim ke sini" placeholder="dinda.aulia@ui.ac.id" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} onBlur={() => validate("email")} />
          <Field id="f-phone" label="No. WhatsApp" required type="tel" inputMode="tel" helper="Untuk info show & e-tiket" placeholder="0812-3456-7890" autoComplete="tel" value={phone} error={errors.phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => validate("phone")} />
          <Field id="f-org" label="Asal instansi" helper="Opsional" placeholder="Contoh: Universitas Indonesia" autoComplete="organization" value={org} onChange={(e) => setOrg(e.target.value)} />
          <div className="flex flex-col gap-2">
            <span className="type-label text-text-strong">
              Jumlah tiket<span className="text-text-danger" aria-hidden="true"> *</span>
            </span>
            <Quantity label="Jumlah tiket" value={qty} min={1} max={MAX_TICKETS} onChange={(n) => { setQty(n); update({ qty: n, seats: booking.seats.slice(0, n) }); }} />
            <p className="type-caption text-text-secondary">Maks. 4 tiket per transaksi. Kursinya kamu pilih di langkah berikutnya.</p>
          </div>
          <hr className="border-t-2 border-border-subtle" />
          <div id="f-agree" tabIndex={-1} className="focus:outline-none">
            <Checkbox checked={agree} error={errors.agree} onChange={(v) => { setAgree(v); validate("agree", { agree: v }); }}>
              Aku setuju dengan Syarat & Ketentuan pembelian tiket dan kebijakan refund.
            </Checkbox>
          </div>
          <div className="hidden justify-end lg:flex">
            <Button type="submit" icon="arrow-right">Lanjut Pilih Kursi</Button>
          </div>
        </form>
      </CheckoutCard>
    </CheckoutShell>
  );
}
