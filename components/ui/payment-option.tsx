"use client";
import { Icon, type IconName } from "./icon";

type Props = { name: string; value: string; checked: boolean; onChange: (value: string) => void; title: string; description: string; icon: IconName; disabled?: boolean };

export function PaymentOption({ name, value, checked, onChange, title, description, icon, disabled }: Props) {
  const state = disabled
    ? "cursor-not-allowed border-2 border-border-subtle bg-bg-disabled"
    : checked
      ? "cursor-pointer border-[3px] border-border-brand bg-bg-brand-soft shadow-sticker"
      : "cursor-pointer border-2 border-border-default bg-bg-surface hover:bg-bg-accent-soft hover:shadow-sticker";
  return (
    <label className={`flex min-h-11 items-center gap-4 rounded-md px-5 py-4 transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-border-focus ${state}`}>
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} className="sr-only" />
      <span aria-hidden="true" className={`flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-bg-surface transition-colors duration-(--duration-fast) ${checked ? "border-border-brand" : disabled ? "border-border-subtle" : "border-border-default"}`}>
        {checked && <span className="size-2.5 animate-pop rounded-full bg-bg-brand" />}
      </span>
      <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-sm border-2 ${disabled ? "border-border-subtle bg-bg-muted text-text-disabled" : "border-border-default bg-bg-accent text-text-primary"}`}>
        <Icon name={icon} size={24} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`type-body-m ${disabled ? "text-text-disabled" : "text-text-strong"}`}>{title}</span>
        <span className={`type-caption ${disabled ? "text-text-disabled" : "text-text-secondary"}`}>{description}</span>
      </span>
    </label>
  );
}
