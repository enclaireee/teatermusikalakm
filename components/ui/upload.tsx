"use client";
import { useRef, useState } from "react";
import { Icon } from "./icon";
import { Button } from "./button";

type Props = {
  file: { name: string; size: number } | null;
  error?: string;
  accept: string;
  onFile: (file: File) => void; // also used to replace an uploaded file ("Ganti")
};

const mb = (n: number) => `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;

export function Upload({ file, error, accept, onFile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = () => input.current?.click();
  const take = (f?: File) => f && onFile(f);

  const hidden = (
    <input ref={input} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-hidden="true"
      onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
  );

  if (file && !error) {
    return (
      <>
      {hidden}
      <div className="animate-enter flex min-w-0 items-center gap-3 rounded-md border-2 border-border-brand bg-bg-surface p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-sm border-2 border-border-brand bg-bg-brand-soft text-text-brand"><Icon name="file" size={24} /></span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-body-m truncate text-text-strong">{file.name}</p>
          <p className="type-caption text-text-brand">{mb(file.size)} · Siap dikirim</p>
        </div>
        <Button variant="ghost" onClick={pick}>Ganti</Button>
      </div>
      </>
    );
  }

  const tone = error ? "border-border-danger bg-bg-danger-soft" : over ? "border-border-brand bg-bg-accent-soft" : "border-border-default bg-bg-surface";
  const title = error ? "File tidak bisa dipakai" : "Upload bukti pembayaran";
  const desc = error ?? "Tarik file ke sini atau pilih dari perangkat · JPG, PNG, PDF";
  return (
    <>
    {hidden}
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
      className={`flex min-w-0 flex-col items-center gap-3 rounded-md border-2 border-dashed p-6 text-center transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-out-soft) ${tone}`}
    >
      <Icon name={error ? "alert-circle" : "upload"} size={32} className={error ? "text-text-danger" : "text-text-brand"} />
      <p className="type-body-m text-text-strong">{title}</p>
      <p role={error ? "alert" : undefined} className={`type-caption ${error ? "text-text-danger" : "text-text-secondary"}`}>{desc}</p>
      <Button variant="secondary" onClick={pick}>{error ? "Pilih file lain" : "Pilih file"}</Button>
    </div>
    </>
  );
}
