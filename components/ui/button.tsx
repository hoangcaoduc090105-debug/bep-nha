import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent active:brightness-90",
  secondary: "bg-surface text-text border-2 border-border-input active:bg-surface-warm",
  quiet: "bg-transparent text-accent underline underline-offset-4 active:bg-accent-soft",
  danger: "bg-surface text-danger border-2 border-danger active:bg-accent-soft",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-3 rounded-md px-6 text-lg font-semibold",
        "transition-[filter,background-color] duration-(--motion-fast)",
        "disabled:cursor-not-allowed disabled:opacity-55",
        size === "lg" ? "min-h-target-lg" : "min-h-target",
        fullWidth && "w-full",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle aria-hidden className="size-6 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
}
