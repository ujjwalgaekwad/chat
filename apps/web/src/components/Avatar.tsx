import { cn, hashToHue, initials } from "../lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  presence?: "online" | "offline" | "none";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-16 w-16 text-lg",
};

const RING_OFFSET: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "-inset-0.5",
  md: "-inset-0.5",
  lg: "-inset-[3px]",
  xl: "-inset-1",
};

export function Avatar({ name, src, size = "md", presence = "none", className }: AvatarProps) {
  const hue = hashToHue(name);

  return (
    <span className={cn("relative inline-flex shrink-0", className)} title={name}>
      {presence !== "none" && (
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full ring-2",
            RING_OFFSET[size],
            presence === "online" ? "ring-pine-400" : "ring-ink-300 dark:ring-ink-700"
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-full font-semibold text-white overflow-hidden",
          SIZE_CLASSES[size]
        )}
        style={!src ? { backgroundColor: `hsl(${hue} 42% 42%)` } : undefined}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{initials(name) || "?"}</span>
        )}
      </span>
      {presence === "online" && (
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-pine-400 ring-2 ring-white dark:ring-ink-900 animate-presence-pulse"
        />
      )}
    </span>
  );
}
