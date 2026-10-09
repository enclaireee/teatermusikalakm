"use client";
import { useId } from "react";
import { Icon } from "./icon";

type Props = { checked: boolean; onChange: (checked: boolean) => void; error?: string; disabled?: boolean; children: React.ReactNode };

export function Checkbox({ checked, onChange, error, disabled, children }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label className={`flex min-h-11 items-start gap-3 py-2 ${disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer text-text-primary"}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`mt-px flex size-[22px] shrink-0 items-center justify-center rounded-sm border-2 text-text-on-brand transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-out-soft) peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-border-focus ${
            disabled ? "border-border-subtle bg-bg-disabled" : error ? "border-border-danger bg-bg-danger-soft" : checked ? "border-border-default bg-bg-brand" : "border-border-default bg-bg-surface"
          }`}
        >
          {checked && <Icon name="check" size={16} className="animate-pop" />}
        </span>
        <span className="type-body-s min-w-0">{children}</span>
      </label>
      {error && <p id={`${id}-err`} className="type-caption animate-slide-down pl-[34px] text-text-danger">{error}</p>}
    </div>
  );
}
