import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className="type-h3 text-text-strong">Pesanan</h1>
      <div className="flex items-center gap-3">
        <Link href="/admin/kursi" className="type-label inline-flex min-h-11 items-center text-text-brand underline">Denah kursi</Link>
        <form action={logout}>
          <Button flat type="submit" variant="secondary">Keluar</Button>
        </form>
      </div>
    </header>
  );
}
