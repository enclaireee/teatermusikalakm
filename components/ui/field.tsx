"use client";
import { useId } from "react";
import { Icon } from "./icon";

type Props = {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

export function Field({ label, required, helper, error, id, disabled, ...rest }: Props) {
  const gen = useId();
  const fid = id ?? gen;
  const msg = error ?? helper;
  const mid = `${fid}-msg`;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={fid} className="type-label text-text-strong">
        {label}
        {required && <span className="text-text-danger" aria-hidden="true"> *</span>}
      </label>
      <div className="relative">
        <input
          id={fid}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={msg ? mid : undefined}
          className={`type-body-m min-h-11 w-full min-w-0 rounded-md border-2 px-4 py-3 transition-[border-color,background-color] duration-(--duration-fast) ease-(--ease-out-soft) text-text-strong placeholder:text-text-secondary focus:border-border-focus focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-border-focus disabled:border-border-subtle disabled:bg-bg-disabled disabled:text-text-disabled ${
            error ? "border-border-danger bg-bg-danger-soft pr-12" : "border-border-default bg-bg-surface hover:border-border-brand"
          }`}
          {...rest}
        />
        {error && <Icon name="alert-circle" size={20} className="animate-slide-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-danger" />}
      </div>
      {msg && <p id={mid} key={error ? "e" : "h"} className={`type-caption ${error ? "animate-slide-down" : ""} ${error ? "text-text-danger" : "text-text-secondary"}`}>{msg}</p>}
    </div>
  );
}
