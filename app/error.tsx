"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { INNER, SECTION } from "@/components/site/decor";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/event";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <>
      <Navbar />
      <main className={`${SECTION} pt-26 lg:pt-36`}>
        <div className={`${INNER} flex flex-col items-center gap-6 text-center`}>
          <h1 className="type-h1 md:type-display-l text-text-strong">Lampu panggung padam sebentar</h1>
          <p className="type-body-l max-w-xl text-text-primary">Ada yang error di sisi kami. Coba lagi sebentar ya. Kalau kamu lagi checkout, data pesananmu masih tersimpan di browser ini.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => retry()}>Coba lagi</Button>
            <Button href="/" variant="secondary">Kembali ke Beranda</Button>
          </div>
          <div className="flex flex-col gap-1">
            {error.digest && <p className="type-caption text-text-primary">Kode error: {error.digest}</p>}
            <p className="type-caption text-text-primary">Masih bermasalah? Hubungi panitia di Instagram {CONTACT.instagram} atau {CONTACT.email}.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
