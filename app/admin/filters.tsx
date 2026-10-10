import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const SELECT = "type-body-m min-h-11 w-full min-w-0 rounded-md border-2 border-border-default bg-bg-surface px-3 text-text-strong";

function Select({ name, label, value, options }: { name: string; label: string; value: string; options: [string, string][] }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={name} className="type-label text-text-strong">{label}</label>
      <select id={name} name={name} defaultValue={value} className={SELECT}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export function Filters({ q, show, cek, harga }: { q: string; show: string; cek: string; harga: string }) {
  return (
    <form method="get" action="/admin" className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[1fr_160px_180px_160px_auto]">
      <div className="md:col-span-2 xl:col-span-1">
        <Field label="Cari" type="search" name="q" defaultValue={q} placeholder="Kode, nama, email, HP, atau kursi" autoComplete="off" />
      </div>
      <Select name="show" label="Show" value={show} options={[["", "Semua show"], ["1", "Show 1"], ["2", "Show 2"]]} />
      <Select name="cek" label="Cek admin" value={cek} options={[["", "Semua"], ["belum", "Belum dicek"], ["valid", "Valid"], ["tidak", "Tidak valid"]]} />
      <Select name="harga" label="Harga" value={harga} options={[["", "Semua"], ["presale", "Presale"], ["normal", "Normal"]]} />
      <div className="flex items-center gap-3 md:col-span-2 xl:col-span-1">
        <Button flat type="submit">Terapkan</Button>
        <Link href="/admin" className="type-label inline-flex min-h-11 items-center px-3 text-text-brand underline">Reset</Link>
      </div>
    </form>
  );
}
