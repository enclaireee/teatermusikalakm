"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { AdminOrder } from "@/lib/admin";
import { updateBuyer, type AdminResult } from "../actions";

export function BuyerForm({ order }: { order: AdminOrder }) {
  const b = order.buyer;
  const [v, setV] = useState({ name: b.name, email: b.email, phone: b.phone, org: b.org ?? "" });
  const [result, setResult] = useState<AdminResult>();
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(undefined);
    start(async () => setResult(await updateBuyer(order.id, v)));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 className="type-h4 text-text-strong">Ubah data pembeli</h2>
      <Field label="Nama" required autoComplete="off" value={v.name} onChange={set("name")} />
      <Field label="Email" type="email" required autoComplete="off" value={v.email} onChange={set("email")} />
      <Field label="WhatsApp" type="tel" required autoComplete="off" value={v.phone} onChange={set("phone")} />
      <Field label="Instansi (opsional)" autoComplete="off" value={v.org} onChange={set("org")} />
      <div>
        {result?.ok === true && <Alert type="success" title="Data pembeli tersimpan" />}
        {result?.ok === false && <Alert type="error" title="Gagal menyimpan">{result.error}</Alert>}
      </div>
      <Button flat type="submit" loading={pending}>Simpan perubahan</Button>
    </form>
  );
}
