"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="min-h-dvh bg-bg-page bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 md:px-6">
        <section className="flex flex-col gap-3 rounded-md border-2 border-border-default bg-bg-surface bg-paper p-4 md:p-6">
          <h1 className="type-h3 text-text-strong">Gagal memuat data admin</h1>
          <p className="type-body-m text-text-primary">Kemungkinan ada masalah koneksi atau database. Coba lagi sebentar.</p>
          {error.digest && <p className="type-caption text-text-secondary">Kode error: {error.digest}</p>}
          <div className="flex flex-wrap gap-3">
            <Button flat onClick={() => retry()}>Coba lagi</Button>
            <Button flat variant="secondary" href="/admin">Kembali ke daftar</Button>
          </div>
        </section>
      </div>
    </main>
  );
}
