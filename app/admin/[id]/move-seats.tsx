"use client";

import { useState, useTransition } from "react";
import { SeatMap } from "@/components/seat/seat-map";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SEATS } from "@/lib/seats";
import type { AdminOrder } from "@/lib/admin";
import { moveSeats, type AdminResult } from "../actions";

export function MoveSeats({ order, taken }: { order: AdminOrder; taken: string[] }) {
  const [sel, setSel] = useState(order.seats);
  const [result, setResult] = useState<AdminResult & { to?: string }>();
  const [pending, start] = useTransition();
  const same = sel.length === order.seats.length && sel.every((s) => order.seats.includes(s));
  const key = (id: string) => (SEATS[id] ? SEATS[id].row.charCodeAt(0) * 1000 + SEATS[id].number : 0);
  const list = [...sel].sort((a, b) => key(a) - key(b)).join(", ");

  function move() {
    if (!window.confirm(`Pindahkan pesanan ${order.code} ke kursi ${list}?`)) return;
    setResult(undefined);
    start(async () => setResult({ ...(await moveSeats(order.id, sel)), to: list }));
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="type-h4 text-text-strong">Pindah kursi</h2>
      <p className="type-body-s text-text-primary">Pilih {order.qty} kursi {order.tier} untuk Show {order.show}.</p>
      <SeatMap tier={order.tier} taken={taken} selected={sel} max={order.qty} onChange={setSel} />
      <p role="status" className="type-body-s text-text-strong">Dipilih: {list || "—"} ({sel.length}/{order.qty})</p>
      <div>
        {result?.ok === true && <Alert type="success" title={`Kursi dipindahkan ke ${result.to}`} />}
        {result?.ok === false && <Alert type="error" title="Gagal memindahkan">{result.error}</Alert>}
      </div>
      <div>
        <Button flat disabled={sel.length !== order.qty || same} loading={pending} onClick={move}>Pindahkan kursi</Button>
      </div>
    </div>
  );
}
