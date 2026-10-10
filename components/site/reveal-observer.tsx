"use client";

// One IntersectionObserver for every [data-reveal] element: marks it data-inview once (no scroll
// scrubbing, no replay), then data-revealed after the entrance so hover transitions return to normal.
// Waits for the opening curtain so content behind it reveals as the curtain rises.
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PENDING = "[data-reveal]:not([data-inview])";
const SETTLE_MS = 1600; // longest entrance (~1 s) + max stagger

function reveal(el: Element) {
  el.setAttribute("data-inview", "");
  window.setTimeout(() => el.setAttribute("data-revealed", ""), SETTLE_MS);
}

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = reduce || !("IntersectionObserver" in window)
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              reveal(e.target);
              io!.unobserve(e.target);
            }
          },
          { threshold: 0, rootMargin: "0px 0px -12% 0px" }, // ratio-free so tall blocks still trigger
        );

    const scan = () => {
      for (const el of document.querySelectorAll(PENDING)) {
        if (io) io.observe(el);
        else reveal(el);
      }
    };

    let started = false;
    const start = () => {
      if (started || html.dataset.curtain === "closed") return;
      started = true;
      scan();
    };
    start();

    const curtain = new MutationObserver(start);
    curtain.observe(html, { attributes: true, attributeFilter: ["data-curtain"] });

    // Client navigations and late-mounting checkout content add new targets.
    let raf = 0;
    const added = new MutationObserver(() => {
      if (!started) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      curtain.disconnect();
      added.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
