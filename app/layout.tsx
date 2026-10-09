import type { Metadata } from "next";
import { Kirang_Haerang, Plus_Jakarta_Sans } from "next/font/google";
import { ViewTransition } from "react";
import { CurtainLoader } from "@/components/site/curtain-loader";
import "./globals.css";

const kirang = Kirang_Haerang({ weight: "400", subsets: ["latin"], variable: "--font-kirang" });
// ponytail: stand-in for Bootzy TM. Drop the .woff2 into app/fonts/ and load it with
// next/font/local as variable "--font-bootzy"; --font-body already prefers it.
const jakarta = Plus_Jakarta_Sans({ weight: "600", subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: { default: "Teater Musikal Aku, Kau & Musik", template: "%s · Aku, Kau & Musik" },
  description:
    "Beli tiket Teater Musikal Aku, Kau & Musik — Kamis, 29 Oktober 2026 di Makara Art Center UI. Presented by Juzzer × Stage Universitas Indonesia.",
  icons: { icon: "/logo-akm.webp", apple: "/logo-akm.webp" },
};

// <html data-curtain>: "closed" (curtain down, set here before paint) → "open" (CurtainLoader lifts it)
// or "skip" (already seen this session). The timeout is a failsafe in case React never hydrates.
const CURTAIN_SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem("akm-curtain")){d.dataset.curtain="skip"}else{d.dataset.curtain="closed";setTimeout(function(){if(d.dataset.curtain==="closed")d.dataset.curtain="open"},6000)}}catch(e){document.documentElement.dataset.curtain="skip"}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${kirang.variable} ${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: decide whether the opening curtain shows (once per session). See CURTAIN_SCRIPT. */}
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: CURTAIN_SCRIPT }} />
        <noscript>
          <style>{".akm-curtain{display:none!important}"}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col bg-bg-page bg-paper text-text-primary">
        <CurtainLoader />
        {/* Route changes are transitions, so this crossfades page content (see .page in globals.css). */}
        <ViewTransition default="page">{children}</ViewTransition>
      </body>
    </html>
  );
}
