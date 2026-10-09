"use client";

import { useEffect, useRef, useState } from "react";
import "./curtain-loader.css";

const MIN_MS = 1100;
const MAX_MS = 2800;
const DONE_MS = 2400; // lift 1.4 s + spotlight tail

function Scallops({ tile, h, className }: { tile: number; h: number; className: string }) {
  const r = h * 0.45;
  const id = `cl-${tile}-${h}`;
  return (
    <svg aria-hidden width="100%" height={h} strokeWidth={3} className={`curtain-scallop ${className}`}>
      <defs>
        <pattern id={id} width={tile} height={h} patternUnits="userSpaceOnUse">
          <path d={`M0 0H${tile}V${h - r}A${tile / 2} ${r} 0 0 1 0 ${h - r}Z`} />
        </pattern>
      </defs>
      <rect width="100%" height={h} fill={`url(#${id})`} stroke="none" />
    </svg>
  );
}

export function CurtainLoader() {
  const [gone, setGone] = useState(false);
  const [open, setOpen] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const liftRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.curtain === "skip") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decided from a pre-hydration DOM flag
      setGone(true);
      return;
    }
    const timers: number[] = [];
    const finish = () => timers.push(window.setTimeout(() => setGone(true), DONE_MS));
    const lift = () => {
      if (root.dataset.curtain !== "open") root.dataset.curtain = "open";
      try {
        sessionStorage.setItem("akm-curtain", "1");
      } catch {}
      setOpen(true);
      finish();
    };
    if (root.dataset.curtain === "open") {
      setOpen(true);
      finish();
      return () => timers.forEach(clearTimeout);
    }
    let lifted = false;
    const once = () => {
      if (!lifted) {
        lifted = true;
        lift();
      }
    };
    liftRef.current = once;
    skipRef.current?.focus({ preventScroll: true });
    const loaded = new Promise<void>((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
    });
    const minWait = new Promise<void>((res) => timers.push(window.setTimeout(res, MIN_MS)));
    Promise.all([document.fonts.ready, loaded, minWait]).then(once);
    timers.push(window.setTimeout(once, MAX_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  if (gone) return null;

  return (
    <div className={`akm-curtain curtain-root`} role="status" aria-live="polite" aria-hidden={open || undefined}>
      <span className="sr-only">Memuat halaman</span>
      <div className="curtain-curtain">
        <div aria-hidden className="curtain-valance">
          <div className="curtain-trim" />
          <Scallops tile={78} h={56} className="curtain-mobile" />
          <Scallops tile={120} h={96} className="curtain-desktop" />
        </div>
        <svg aria-hidden className="curtain-hem" strokeWidth={3} preserveAspectRatio="none">
          <defs>
            <pattern id="cl-hem" width="120" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 0H120V12A60 60 0 0 1 0 12Z" />
              <path className="curtain-fringe" strokeWidth={5} d="M116 12A56 56 0 0 1 4 12" />
            </pattern>
          </defs>
          <rect width="100%" height="72" fill="url(#cl-hem)" stroke="none" />
        </svg>
        <div className="curtain-content">
          {/* eslint-disable-next-line @next/next/no-img-element -- must paint immediately, no lazy loading */}
          <img src="/logo-akm.webp" alt="" width={700} height={516} className="curtain-logo" />
          <p className={`type-label curtain-label`}>TEATER MUSIKAL</p>
          <p className={`type-body-m curtain-msg`}>Sebentar, panggung disiapkan…</p>
          <div aria-hidden className="curtain-bulbs">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="curtain-bulb" style={{ animationDelay: `${i * 130}ms` }} />
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="curtain-spot" />
      <button ref={skipRef} type="button" className={`type-label curtain-skip`} onClick={() => liftRef.current()}>
        Lewati
      </button>
    </div>
  );
}
