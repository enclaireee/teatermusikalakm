import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/#tentang", label: "Tentang" },
  { href: "/tiket", label: "Cek Tiket" },
];

/** Green top bar (Figma "Navbar"). Checkout pages pass cta={false}. `current` highlights the active link. */
export function Navbar({ cta = true, current }: { cta?: boolean; current?: "/" | "/tiket" }) {
  return (
    <header style={{ viewTransitionName: "site-header" }} className="sticky top-0 z-40 border-b-[3px] border-border-default bg-bg-brand">
      <nav aria-label="Utama" className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 lg:px-20 lg:py-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <Link href="/" aria-label="Aku Kau & Musik — Beranda" className="shrink-0">
            <Image src="/logo-akm.webp" alt="" width={700} height={516} priority sizes="(min-width: 64rem) 87px, 60px" className="h-11 w-auto lg:h-16" />
          </Link>
          <span aria-hidden className="h-8 w-0.5 shrink-0 bg-white/40 lg:h-10" />
          <p className="type-label md:type-h4 min-w-0 text-text-on-brand">
            Presented by<br />
            {/* Short form on very narrow phones so the header stays two lines high. */}
            Juzzer × Stage <span className="max-[359px]:hidden">Universitas Indonesia</span><span className="min-[360px]:hidden">UI</span>
          </p>
        </div>

        <div className="hidden items-center gap-10 lg:flex">
          <ul className="flex gap-8">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={current === l.href ? "page" : undefined}
                  className="type-label text-text-on-brand hover:text-text-accent aria-[current=page]:text-text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {cta && <Button variant="accent" icon="ticket" href="/#jadwal">Beli Tiket</Button>}
        </div>

        <MobileMenu links={LINKS} cta={cta} current={current} />
      </nav>
    </header>
  );
}
