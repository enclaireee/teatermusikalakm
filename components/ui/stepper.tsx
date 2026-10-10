import { Icon } from "./icon";

const LABELS = ["Pilih Tiket", "Data Diri", "Pilih Kursi", "Pembayaran", "E-Tiket"];

export function Stepper({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <nav aria-label="Langkah pemesanan">
      {/* Mobile: title + progress */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <p aria-current="step" className="type-h4 text-text-strong"><span className="sr-only">Langkah {step} dari 5: </span>{LABELS[step - 1]}</p>
          <p aria-hidden="true" className="type-caption text-text-secondary">Langkah {step} dari 5</p>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {LABELS.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-(--duration-slow) ease-(--ease-out-soft) ${i + 1 < step ? "bg-bg-brand" : i + 1 === step ? "bg-bg-accent" : "bg-bg-disabled"}`} />
          ))}
        </div>
      </div>
      {/* Desktop: dots */}
      <ol className="hidden items-center gap-2 lg:flex xl:gap-3">
        {LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`type-label flex size-8 items-center justify-center rounded-full border-2 transition-colors duration-(--duration-slow) ease-(--ease-out-soft) ${current ? "animate-pop" : ""} ${
                    done ? "border-border-default bg-bg-brand text-text-on-brand" : current ? "border-border-default bg-bg-accent text-text-strong" : "border-border-subtle bg-bg-surface text-text-secondary"
                  }`}
                >
                  {done ? <Icon name="check" size={18} /> : n}
                </span>
                <span className={`type-label ${done ? "text-text-primary" : current ? "text-text-strong" : "text-text-secondary"}`}>{label}</span>
              </span>
              {n < 5 && <span aria-hidden="true" className={`h-0.5 w-6 xl:w-12 transition-colors duration-(--duration-slow) ease-(--ease-out-soft) ${done ? "bg-bg-brand" : "bg-bg-disabled"}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
