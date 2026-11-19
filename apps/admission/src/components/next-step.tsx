import { cn, RegistryIcon } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"

/**
 * The next step of the student pathway: one link card, usually at the end of a page, pointing to the page that
 * tends to come next. It is a suggestion, never a gate, so it never hides or disables anything.
 */
export function NextStep({
  href,
  label,
  hint,
  className,
}: {
  href: string
  label: string
  hint?: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "bg-card hover:bg-accent focus-visible:ring-ring rounded-card group flex min-w-0 items-center gap-3 border p-4 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="text-muted-foreground mt-0.5 block text-xs">{hint}</span> : null}
      </span>
      <RegistryIcon
        name="arrowRight"
        className="text-primary shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
