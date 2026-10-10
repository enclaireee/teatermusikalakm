"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import type { AdminOrder } from "@/lib/admin";
import { deleteOrder } from "../actions";

export function DeleteOrder({ order }: { order: AdminOrder }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const ok = typed === order.code && !pending;

  function remove() {
    setError(undefined);
    start(async () => {
      const r = await deleteOrder(order.id); // redirects to /admin on success
      if (r && !r.ok) setError(r.error);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border-2 border-border-danger bg-bg-danger-soft p-4 md:p-6">
      <h2 className="type-h4 text-text-danger">Hapus pesanan</h2>
      <p className="type-body-s text-text-primary">Menghapus pesanan bersifat permanen: data pembeli dan bukti pembayaran hilang, kursinya bisa dibeli orang lain.</p>
      <div className="max-w-sm">
        <Field label={`Ketik kode ${order.code} untuk konfirmasi`} autoComplete="off" autoCapitalize="characters" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value.toUpperCase())} />
      </div>
      {error && <Alert type="error" title="Gagal menghapus">{error}</Alert>}
      <div>
        <button
          type="button"
          disabled={!ok}
          aria-busy={pending || undefined}
          onClick={remove}
          className="type-label-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-2 border-border-danger bg-bg-danger px-6 py-3 text-text-on-brand hover:bg-bg-danger-strong disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled"
        >
          {pending && <Icon name="loader" size={20} className="animate-spin" />}
          {pending ? "Menghapus…" : "Hapus pesanan"}
        </button>
      </div>
    </section>
  );
}
