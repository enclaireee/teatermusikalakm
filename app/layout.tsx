import type { Metadata } from "next";
import { Kirang_Haerang } from "next/font/google";
import localFont from "next/font/local";
import { ViewTransition } from "react";
import { CurtainLoader } from "@/components/site/curtain-loader";
import { RevealObserver } from "@/components/site/reveal-observer";
import "./globals.css";

const kirang = Kirang_Haerang({ weight: "400", subsets: ["latin"], variable: "--font-kirang" });
// Bootzy TM ships a single weight; declaring it for 400–700 lets the body styles (weight 600) use it without faux bold.
const bootzy = localFont({ src: "./fonts/BootzyTM.woff2", weight: "400 700", variable: "--font-bootzy", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Teater Musikal Aku, Kau & Musik", template: "%s · Aku, Kau & Musik" },
  description:
    "Beli tiket Teater Musikal Aku, Kau & Musik — Kamis, 29 Oktober 2026 di Makara Art Center UI. Presented by Juzzer × Stage Universitas Indonesia.",
  icons: { icon: "/logo-akm.webp", apple: "/logo-akm.webp" },
};

// Adds html.js (reveal hidden states only apply with JS). <html data-curtain>: "closed" (curtain down, set here before paint) → "open" (CurtainLoader lifts it)
// or "skip" (already seen this session). The timeout is a failsafe in case React never hydrates.
const CURTAIN_SCRIPT = `document.documentElement.classList.add("js");try{var d=document.documentElement;if(sessionStorage.getItem("akm-curtain")){d.dataset.curtain="skip"}else{d.dataset.curtain="closed";setTimeout(function(){if(d.dataset.curtain==="closed")d.dataset.curtain="open"},6000)}}catch(e){document.documentElement.dataset.curtain="skip"}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${kirang.variable} ${bootzy.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: decide whether the opening curtain shows (once per session). See CURTAIN_SCRIPT. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: CURTAIN_SCRIPT }} />
        <noscript>
          <style>{".akm-curtain{display:none!important}"}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col bg-bg-page bg-paper text-text-primary">
        <CurtainLoader />
        <RevealObserver />
        {/* Route changes are transitions, so this crossfades page content (see .page in globals.css). */}
        <ViewTransition default="page">{children}</ViewTransition>
      </body>
    </html>
  );
}
