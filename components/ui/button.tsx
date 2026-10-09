import Link from "next/link";
import { Icon, type IconName } from "./icon";

type Variant = "primary" | "accent" | "secondary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-bg-brand text-text-on-brand border-2 border-border-default shadow-sticker hover:bg-bg-brand-strong hover:shadow-sticker-l",
  accent: "bg-bg-accent text-text-on-accent border-2 border-border-default shadow-sticker hover:bg-bg-accent-strong hover:shadow-sticker-l",
  secondary: "bg-bg-surface text-text-strong border-2 border-border-default shadow-sticker hover:bg-bg-accent-soft hover:shadow-sticker-l",
  ghost: "bg-transparent text-text-brand border-2 border-transparent hover:bg-bg-brand-soft",
};

const DISABLED = "aria-disabled:pointer-events-none aria-disabled:bg-bg-disabled aria-disabled:text-text-disabled aria-disabled:shadow-none aria-disabled:border-border-subtle";

type Props = {
  variant?: Variant;
  icon?: IconName;
  iconStart?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  href?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Button({ variant = "primary", icon, iconStart, loading, fullWidth, href, children, disabled, type = "button", ...rest }: Props) {
  const off = disabled || loading;
  const cls = `type-label-button inline-flex min-h-11 whitespace-nowrap text-center items-center justify-center gap-2 rounded-md px-6 py-4 transition-[background-color,box-shadow,translate,color] duration-(--duration-base) ease-(--ease-out-soft) hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-sticker-s ${VARIANT[variant]} ${DISABLED} ${fullWidth ? "w-full" : ""}`;
  const content = loading ? (
    <>
      <span className="animate-enter-scale inline-flex"><Icon name="loader" size={20} className="animate-spin" /></span>
      Memproses…
    </>
  ) : (
    <>
      {icon && iconStart && <Icon name={icon} size={20} />}
      {children}
      {icon && !iconStart && <Icon name={icon} size={20} />}
    </>
  );
  if (href && !off) return <Link href={href} className={cls}>{content}</Link>;
  if (href) return <span role="link" aria-disabled="true" className={cls}>{content}</span>;
  return (
    <button type={type} disabled={off} aria-busy={loading || undefined} aria-disabled={off || undefined} className={cls} {...rest}>
      {content}
    </button>
  );
}
