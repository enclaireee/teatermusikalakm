"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { INVITE_CODE } from "@/lib/event";

/** Native <dialog> modal: browser handles focus trap, Esc and focus return to the opener. */
export function InviteDialog({ open, onClose, onUnlock }: { open: boolean; onClose: () => void; onUnlock: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setCode("");
      setError(undefined);
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().toLowerCase() === INVITE_CODE.toLowerCase()) onUnlock();
    else setError("Kode tidak ditemukan. Cek lagi huruf & angkanya.");
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-120 rounded-lg border-2 border-border-default bg-bg-surface bg-paper p-0 shadow-sticker-l backdrop:bg-bg-inverse/60 scale-95 opacity-0 transition-[opacity,scale,display,overlay] duration-(--duration-base) ease-(--ease-out-soft) [transition-behavior:allow-discrete] open:scale-100 open:opacity-100 starting:open:scale-95 starting:open:opacity-0 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:duration-(--duration-base) backdrop:[transition-behavior:allow-discrete] open:backdrop:opacity-100 starting:open:backdrop:opacity-0"
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-5 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="type-h3 text-text-brand">Masukkan kode undangan</h2>
          <button type="button" aria-label="Tutup" onClick={onClose} className="flex size-11 shrink-0 items-center justify-center rounded-md text-text-primary hover:bg-bg-brand-soft">
            <Icon name="x" size={24} />
          </button>
        </div>
        <p className="type-body-s text-text-secondary">Kode ada di undangan dari panitia. Setelah valid, kursi VIP bisa dipilih.</p>
        <Field label="Kode undangan" placeholder="Contoh: AKM-INV-12" autoComplete="off" autoFocus value={code} error={error} onChange={(e) => { setCode(e.target.value); setError(undefined); }} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" icon="lock">Buka Kursi</Button>
        </div>
      </form>
    </dialog>
  );
}
