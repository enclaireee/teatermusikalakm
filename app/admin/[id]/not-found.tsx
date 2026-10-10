import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <main className="min-h-dvh bg-bg-page bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 md:px-6">
        <section className="flex flex-col gap-3 rounded-md border-2 border-border-default bg-bg-surface bg-paper p-4 md:p-6">
          <h1 className="type-h3 text-text-strong">Pesanan tidak ditemukan</h1>
          <p className="type-body-m text-text-primary">Mungkin sudah dihapus atau link-nya salah.</p>
          <div><Button flat href="/admin">Kembali ke daftar pesanan</Button></div>
        </section>
      </div>
    </main>
  );
}
