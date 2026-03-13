import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const sizes: Record<LogoSize, { badge: number; font: number; vinFont: number; gap: number }> = {
  sm: { badge: 20, font: 15, vinFont: 13, gap: 1 },
  md: { badge: 32, font: 24, vinFont: 20, gap: 2 },
  lg: { badge: 44, font: 34, vinFont: 28, gap: 2 },
};

export function Logo({
  size = "md",
  className,
  iconOnly = false,
}: {
  size?: LogoSize;
  className?: string;
  iconOnly?: boolean;
}) {
  const s = sizes[size];
  const badgeWidth = Math.round(s.badge * (86 / 44));
  const pathScale = s.badge / 44;

  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: s.gap }}>
      {/* Parallelogram badge with VIN */}
      <svg
        width={badgeWidth}
        height={s.badge}
        viewBox={`0 0 ${badgeWidth} ${s.badge}`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d={scalePath("M14 0l72 0-14 44-72 0z", pathScale)}
          className="fill-brand-accent"
        />
        <text
          x={badgeWidth / 2 - 1}
          y={s.badge / 2}
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontFamily="Inter, -apple-system, sans-serif"
          fontWeight="800"
          fontSize={s.vinFont}
          letterSpacing="1.5"
        >
          VIN
        </text>
      </svg>
      {/* "dex" text */}
      {!iconOnly && (
        <span
          className="text-brand-primary font-medium leading-none"
          style={{ fontSize: s.font }}
        >
          dex
        </span>
      )}
    </span>
  );
}

function scalePath(d: string, scale: number): string {
  return d.replace(/\d+/g, (match) => String(Math.round(Number(match) * scale)));
}
