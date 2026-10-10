import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className="type-h3 text-text-strong">Pesanan</h1>
      <form action={logout}>
        <Button flat type="submit" variant="secondary">Keluar</Button>
      </form>
    </header>
  );
}
