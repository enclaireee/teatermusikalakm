"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  // Replaces the root layout, so the next/font fonts aren't loaded: headings and body fall back to system fonts.
  return (
    <html lang="id">
      <body className="min-h-dvh bg-bg-page bg-paper text-text-primary">
        <title>Terjadi kesalahan · Aku Kau & Musik</title>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="type-h1 text-text-strong">Terjadi kesalahan</h1>
          <p className="type-body-l">Maaf, ada yang error. Coba lagi sebentar ya.</p>
          {error.digest && <p className="type-caption text-text-secondary">Kode error: {error.digest}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => retry()} className="type-label-button min-h-11 rounded-md border-2 border-border-default bg-bg-brand px-6 py-4 text-text-on-brand shadow-sticker hover:bg-bg-brand-strong">Coba lagi</button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- layout is gone, next/link unavailable */}
            <a href="/" className="type-label-button inline-flex min-h-11 items-center rounded-md border-2 border-border-default bg-bg-surface px-6 py-4 text-text-strong shadow-sticker hover:bg-bg-accent-soft">Kembali ke Beranda</a>
          </div>
        </main>
      </body>
    </html>
  );
}
