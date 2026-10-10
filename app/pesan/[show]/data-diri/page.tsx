"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomBar, CheckoutCard, CheckoutShell, OrderSummary, stepHref, useStepGuard } from "@/components/checkout/shell";
import { RevealText } from "@/components/site/reveal-text";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { useBooking } from "@/lib/booking";
import { SHOWS } from "@/lib/event";
import { checkField } from "@/lib/validate";

const FORM_ID = "data-diri-form";
type Key = "name" | "email" | "phone" | "org" | "agree";
type Errors = Partial<Record<Key, string>>;
const ORDER: Key[] = ["name", "email", "phone", "agree"];

export default function DataDiriPage() {
  const ok = useStepGuard(2);
  return ok ? <Form /> : null;
}

function Form() {
  const { show, booking, update } = useBooking();
  const router = useRouter();
  const b = booking.buyer;
  const [name, setName] = useState(b?.name ?? "");
  const [email, setEmail] = useState(b?.email ?? "");
  const [phone, setPhone] = useState(b?.phone ?? "");
  const [org, setOrg] = useState(b?.org ?? "");
  const [agree, setAgree] = useState(!!b);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const values = { name, email, phone, agree };

  const check = (k: Key, over: Partial<typeof values> = {}) => checkField(k, { ...values, ...over });
  const validate = (k: Key, over: Partial<typeof values> = {}) => setErrors((e) => ({ ...e, [k]: check(k, over) }));
  const count = Object.values(errors).filter(Boolean).length;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    for (const k of ORDER) next[k] = check(k);
    setErrors(next);
    setSubmitted(true);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    const buyer = { name: name.trim(), email: email.trim(), phone: phone.trim(), org: org.trim() };
    const b0 = booking.buyer;
    const changed = !b0 || (["name", "email", "phone", "org"] as const).some((k) => b0[k] !== buyer[k]);
    // changed data makes the server order stale: drop the hold but keep orderId so the next holdSeats releases it
    update({ buyer, ...(changed ? { holdUntil: null, total: null } : {}) });
    router.push(stepHref(show, 3));
  }

  return (
    <CheckoutShell
      step={2}
      aside={<OrderSummary />}
      bottomBar={<BottomBar info={`${SHOWS[show].label} · ${booking.qty} tiket`} cta={{ label: "Lanjut Pilih Kursi", type: "submit", form: FORM_ID }} />}
    >
      <CheckoutCard>
        <form id={FORM_ID} noValidate onSubmit={onSubmit} className="flex flex-col gap-5 lg:gap-6">
          <div className="flex flex-col gap-2">
            <RevealText as="h1" text="Data pemesan" className="type-h2 text-text-brand" />
            <p data-reveal="up" className="type-body-m text-text-secondary">Datanya tercetak di e-tiketmu dan dipakai buat cek tiket, jadi pastikan benar ya.</p>
          </div>
          {submitted && count > 0 && <Alert type="error" title={`Ada ${count} data yang perlu dicek`}>Perbaiki kolom bertanda merah, lalu lanjut lagi.</Alert>}
          <div data-reveal-stagger data-reveal="up" className="flex flex-col gap-5 lg:gap-6">
          <Field id="f-name" label="Nama lengkap" required helper="Sesuai kartu identitas (KTP/KTM)" placeholder="Contoh: Rani Putri" autoComplete="name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} onBlur={() => validate("name")} />
          <Field id="f-email" label="Email" required type="email" inputMode="email" helper="Dipakai buat cek tiketmu nanti" placeholder="rani.putri@ui.ac.id" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} onBlur={() => validate("email")} />
          <Field id="f-phone" label="No. WhatsApp" required type="tel" inputMode="tel" helper="Untuk info show" placeholder="0812-3456-7890" autoComplete="tel" value={phone} error={errors.phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => validate("phone")} />
          <Field id="f-org" label="Asal instansi" helper="Opsional" placeholder="Contoh: Universitas Indonesia" autoComplete="organization" value={org} onChange={(e) => setOrg(e.target.value)} />
          <hr className="border-t-2 border-border-subtle" />
          <div id="f-agree" tabIndex={-1} className="focus:outline-none">
            <Checkbox checked={agree} error={errors.agree} onChange={(v) => { setAgree(v); validate("agree", { agree: v }); }}>
              Aku setuju dengan Syarat & Ketentuan pembelian tiket dan kebijakan refund.
            </Checkbox>
          </div>
          </div>
          <div data-reveal="up" style={{ "--d": "200ms" } as React.CSSProperties} className="hidden justify-end lg:flex">
            <Button type="submit" icon="arrow-right">Lanjut Pilih Kursi</Button>
          </div>
        </form>
      </CheckoutCard>
    </CheckoutShell>
  );
}
