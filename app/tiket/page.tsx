import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { INNER, SECTION } from "@/components/site/decor";
import { TicketLookup } from "./ticket-lookup";

export const metadata: Metadata = {
  title: "Cek Tiket",
  alternates: { canonical: "/tiket" },
  description: "Cek status tiket dan download ulang E-Tiket kamu pakai kode booking dan email.",
};

export default function TiketPage() {
  return (
    <>
      <Navbar current="/tiket" />
      <main className={`${SECTION} pt-26 lg:pt-36`}>
        <div className={INNER}>
          <TicketLookup />
        </div>
      </main>
      <Footer />
    </>
  );
}
