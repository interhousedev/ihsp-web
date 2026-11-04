import { cn } from "../../lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  // A soft shimmer sweep (background-position only); a plain muted block when motion is reduced.
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-xl bg-muted bg-[linear-gradient(100deg,transparent_30%,color-mix(in_oklch,var(--foreground)_6%,transparent)_50%,transparent_70%)] bg-[length:200%_100%] animate-[skeleton-sweep_1.6s_ease-in-out_infinite] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
