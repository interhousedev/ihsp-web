import { cn, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"

/**
 * Page body: one column on mobile, the aside cards in a 2-column grid on tablet (768-1279),
 * and the main column plus a sticky aside on desktop (≥1280). `asideFirst` puts the aside above
 * the main column below desktop (filters, summaries that gate the list).
 */
export function SplitLayout({
  aside,
  asideFirst = false,
  children,
}: {
  aside: ReactNode
  asideFirst?: boolean
  children: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <aside
        className={cn(
          "grid min-w-0 content-start gap-4 md:grid-cols-2 xl:sticky xl:top-20 xl:grid-cols-1 xl:self-start",
          asideFirst && "order-first xl:order-none",
        )}
      >
        {aside}
      </aside>
    </div>
  )
}

/** One card of a `SplitLayout` aside: an optional icon and title, then the content. */
export function AsideCard({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("bg-card rounded-card flex min-w-0 flex-col gap-3 border p-4", className)}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}

/** The tinted icon tile before a page title (pass it as `PageHeader`'s `back`). */
export function HeadingIcon({ name }: { name: keyof typeof Icons }) {
  const Icon = Icons[name]
  return (
    <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
      <Icon aria-hidden className="size-5" />
    </span>
  )
}
