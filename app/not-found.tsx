import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { INNER, SECTION, Star } from "@/components/site/decor";
import { Burst } from "@/components/site/hero-art";
import { Button } from "@/components/ui/button";
import { Stamp } from "@/components/ui/stamp";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  const notch = "absolute size-8 rounded-full border-[3px] border-border-default bg-bg-page";
  return (
    <>
      <Navbar />
      <main className={`${SECTION} pt-26 lg:pt-36`}>
        <Star className="right-4 top-24 w-12 lg:right-24 lg:top-36 lg:w-20" />
        <Star className="bottom-8 left-4 w-10 lg:bottom-24 lg:left-24 lg:w-16" />
        <div className={`${INNER} flex flex-col items-center gap-8 text-center lg:gap-12`}>
          <div className="w-full max-w-3xl px-1 sm:px-0">
            {/* torn ADMIT NONE ticket */}
            <div className="relative flex -rotate-2 flex-col border-[3px] border-border-default bg-bg-page shadow-sticker-l md:flex-row">
              <div className="relative min-w-0 flex-1 overflow-hidden bg-paper p-4 md:p-6">
                <span aria-hidden className="type-caption tracking-[0.2em] text-text-primary">ADMIT NONE</span>
                <p aria-hidden className="type-h1 md:type-display-xl my-2 -rotate-3 text-text-strong">404</p>
                <Burst className="right-3 top-3 size-10 rotate-12 md:size-14" />
              </div>
              <div className="relative flex flex-col gap-2 border-t-[3px] border-dashed border-border-default bg-bg-accent-soft bg-paper p-4 md:w-44 md:shrink-0 md:justify-center md:border-l-[3px] md:border-t-0">
                <span aria-hidden className={`${notch} -left-4 -top-[18px] md:-left-4 md:-top-[19px]`} />
                <span aria-hidden className={`${notch} -right-4 -top-[18px] md:-left-4 md:right-auto md:top-auto md:-bottom-[19px]`} />
                <span aria-hidden className="bg-barcode h-7 w-full opacity-80 md:h-14" />
                <span aria-hidden className="type-caption -rotate-3 text-text-primary">No. 000</span>
              </div>
              <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 sm:scale-100 md:left-[60%] md:top-[78%]">
                <Stamp color="red" rotate={-12} className="animate-stamp whitespace-nowrap bg-bg-page/80">Salah panggung</Stamp>
              </span>
            </div>
          </div>
          <div className="flex max-w-xl flex-col items-center gap-3">
            <h1 className="type-h1 md:type-display-l text-text-strong">Adegan ini nggak ada di naskah</h1>
            <p className="type-body-l text-text-primary">Halaman yang kamu cari nggak ada atau sudah pindah. Yuk, balik ke panggung utama.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/" icon="arrow-right">Kembali ke Beranda</Button>
            <Button href="/tiket" variant="secondary">Cek Tiket</Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
