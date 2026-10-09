"use client";

type Props = { value: number; min?: number; max?: number; onChange: (n: number) => void; label: string };

const BTN = "type-h3 flex size-11 items-center justify-center rounded-md border-2 border-border-default bg-bg-surface text-text-strong shadow-sticker transition-[background-color,box-shadow,translate] duration-(--duration-base) ease-(--ease-out-soft) hover:bg-bg-accent-soft hover:shadow-sticker-l active:shadow-sticker-s disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled disabled:shadow-none";

export function Quantity({ value, min = 1, max, onChange, label }: Props) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <button type="button" aria-label="Kurangi" disabled={value <= min} onClick={() => onChange(value - 1)} className={BTN}>−</button>
      <span aria-live="polite" className="type-h2 min-w-14 text-center text-text-strong">{value}</span>
      <button type="button" aria-label="Tambah" disabled={max !== undefined && value >= max} onClick={() => onChange(value + 1)} className={BTN}>+</button>
    </div>
  );
}
