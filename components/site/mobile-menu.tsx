"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type Item = { href: string; label: string };

/** Mobile disclosure menu; closes on route change and when a link inside is clicked. */
export function MobileMenu({ links, cta, current }: { links: readonly Item[]; cta: boolean; current?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => { ref.current?.removeAttribute("open"); }, [path]);
  return (
    <details ref={ref} className="group relative lg:hidden">
      <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md text-text-on-brand [&::-webkit-details-marker]:hidden">
        <Icon name="menu" className="group-open:hidden" label="Buka menu" />
        <Icon name="x" className="hidden group-open:block" label="Tutup menu" />
      </summary>
      <div
        onClick={(e) => { if ((e.target as HTMLElement).closest("a")) ref.current?.removeAttribute("open"); }}
        className="animate-enter-scale [animation-duration:var(--duration-base)] absolute right-0 top-full mt-2 origin-top-right flex w-56 flex-col gap-1 rounded-md border-2 border-border-default bg-bg-surface p-2 shadow-sticker"
      >
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={current === l.href ? "page" : undefined} className="type-label rounded-sm px-3 py-3 text-text-strong hover:bg-bg-accent-soft aria-[current=page]:text-text-brand">
            {l.label}
          </Link>
        ))}
        {cta && <Button variant="accent" icon="ticket" href="/#jadwal" fullWidth>Beli Tiket</Button>}
      </div>
    </details>
  );
}
