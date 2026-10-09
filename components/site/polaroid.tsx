import { Icon } from "@/components/ui/icon";

/** Polaroid with tape and placeholder photo. `className` sets width (e.g. "w-36 lg:w-66"). */
export function Polaroid({ caption, rotate = 0, className = "", tall = false }: { caption: string; rotate?: number; className?: string; tall?: boolean }) {
  return (
    <figure className={`relative flex flex-col gap-2.5 border-2 border-border-default bg-bg-surface bg-paper px-3 pb-4 pt-3 shadow-sticker reveal rotate-(--r) transition-[translate,rotate,box-shadow] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-1 hover:rotate-[calc(var(--r)*0.5)] hover:shadow-sticker-l ${className}`} style={{ "--r": `${rotate}deg` } as React.CSSProperties}>
      <span aria-hidden className="absolute -top-2.5 left-1/2 z-10 h-[22px] w-[72px] -translate-x-1/2 bg-border-subtle/85" />
      <div className={`flex w-full flex-col items-center justify-center gap-2 bg-bg-muted ${tall ? "aspect-[13/15]" : "aspect-[6/7]"}`}>
        <Icon name="users" size={32} className="text-text-secondary" />
        <span className="type-caption text-text-secondary">Foto (placeholder)</span>
      </div>
      <figcaption className="type-h4 break-words text-text-primary">{caption}</figcaption>
    </figure>
  );
}
