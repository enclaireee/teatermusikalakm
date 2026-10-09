import { Icon, type IconName } from "./icon";

const TYPES = {
  info: ["bg-bg-brand-soft border-border-brand", "info", "text-text-brand"],
  success: ["bg-bg-brand-soft border-border-brand", "check-circle", "text-text-brand"],
  warning: ["bg-bg-accent-soft border-border-default", "clock", "text-text-primary"],
  error: ["bg-bg-danger-soft border-border-danger", "alert-circle", "text-text-danger"],
} as const satisfies Record<string, readonly [string, IconName, string]>;

export function Alert({ type, title, children }: { type: keyof typeof TYPES; title: string; children?: React.ReactNode }) {
  const [box, icon, color] = TYPES[type];
  return (
    <div role={type === "error" ? "alert" : "status"} className={`animate-slide-down flex items-start gap-3 rounded-md border-2 px-4 py-3 ${box}`}>
      <Icon name={icon} size={20} className={`mt-0.5 shrink-0 ${color}`} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="type-label tabular-nums text-text-strong">{title}</p>
        {children && <div className="type-body-s text-text-primary">{children}</div>}
      </div>
    </div>
  );
}
