import { cn } from "@/lib/utils";

type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: number;
  showIcon?: boolean;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  iconClassName?: string;
};

export function Logo({
  size = 48,
  showIcon = true,
  showWordmark = true,
  wordmarkClassName,
  iconClassName,
  className,
  ...props
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {showIcon && (
        <img
          src="/logo-icon.png"
          width={size}
          height={size}
          alt="Laso logo"
          style={{ width: size, height: size }}
          className={cn("rounded-full", iconClassName)}
        />
      )}
      {showWordmark && (
        <span
          className={cn(
            "font-black tracking-tight text-[var(--brand-primary)] font-['Fraunces',serif]",
            wordmarkClassName
          )}
        >
          Laso
        </span>
      )}
    </div>
  );
}

// Backwards compatibility export
export const LogoIcon = Logo;
