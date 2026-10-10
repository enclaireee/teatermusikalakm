import { notFound } from "next/navigation";
import { getOrder } from "@/lib/admin";
import { MarkToggle } from "../mark-toggle";
import { ProofButton } from "../proof-dialog";
import { Alert } from "@/components/ui/alert";
import { BuyerForm } from "./buyer-form";
import { DeleteOrder } from "./delete-order";
import { MoveSeats } from "./move-seats";
import { OrderSummary } from "./order-summary";

// Admin pages are never prerendered; lets the root layout's usePathname() resolve at request time.
export const instant = false;

const PANEL = "rounded-md border-2 border-border-default bg-bg-surface bg-paper p-4 md:p-6";

export default async function OrderPage({ params }: PageProps<"/admin/[id]">) {
  const { id } = await params;
  const detail = await getOrder(id); // checks the admin session first
  if (!detail) notFound();
  const { order, taken } = detail;

  return (
    <main className="min-h-dvh bg-bg-page bg-paper">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 md:px-6">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-4">
            <section className={PANEL}><OrderSummary order={order} /></section>
            <section className={`${PANEL} flex flex-col gap-3`}>
              <h2 className="type-h4 text-text-strong">Bukti pembayaran</h2>
              {order.proofPath ? (
                <>
                  <ProofButton order={order} variant="full" />
                  <p className="type-caption text-text-secondary">Bukti dibuka di jendela pop-up.</p>
                </>
              ) : (
                <Alert type="warning" title="Belum ada bukti" />
              )}
              <h3 className="type-label text-text-strong">Cek admin</h3>
              <MarkToggle id={order.id} code={order.code} checked={order.checked} size="lg" />
              <p className="type-caption text-text-secondary">Hanya terlihat oleh panitia. Tidak mengubah status tiket pembeli.</p>
            </section>
            <section className={PANEL}><MoveSeats order={order} taken={taken} /></section>
          </div>
          <section className={`${PANEL} xl:sticky xl:top-6`}><BuyerForm order={order} /></section>
        </div>
        <DeleteOrder order={order} />
      </div>
    </main>
  );
}
