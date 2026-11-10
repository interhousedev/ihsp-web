"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import type { Widget } from "./model"
import { WIDGET_ICONS } from "./widget-catalog"

/** What a card shows instead of its content while its data is on the way or failed. */
export type CardStatus = "loading" | "error"

/** Placeholder lines while a card's data loads. */
export function CardSkeleton() {
  return (
    <div role="status" aria-busy="true" data-testid="card-skeleton" className="flex flex-col gap-2">
      <div className="bg-foreground/10 h-6 w-1/3 animate-pulse rounded-md" />
      <div className="bg-foreground/10 h-3 w-2/3 animate-pulse rounded-md" />
      <div className="bg-foreground/10 h-3 w-1/2 animate-pulse rounded-md" />
    </div>
  )
}

/** A short text with the icon of the card; `action` is an optional button below it. */
export function CardEmpty({
  icon: Icon = Icons.circleCheck,
  text,
  action,
}: {
  icon?: (typeof WIDGET_ICONS)["homework"]
  text: string
  action?: ReactNode
}) {
  return (
    <div data-testid="card-empty" className="flex flex-col items-start gap-1.5 text-sm opacity-80">
      <Icon aria-hidden className="size-5 opacity-70" />
      <span>{text}</span>
      {action}
    </div>
  )
}

/** The card could not load; the button asks for the data again. */
export function CardError({ onRetry }: { onRetry?: () => void }) {
  const t = useT("today.dashboard")
  return (
    <div role="alert" data-testid="card-error" className="flex flex-col items-start gap-1.5 text-sm">
      <span className="flex items-center gap-1.5">
        <Icons.warning aria-hidden className="size-4" />
        {t("cardError")}
      </span>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * The one chrome of every dashboard block: a header with the block's icon, its title and, when the block links to a
 * page, a "Show all" action; then the body (scrolls inside a fixed-height desktop tile, grows on a phone), or the
 * loading / error state. The tile's colour comes with a text colour that reads on it.
 */
export function DashboardCard({
  widget,
  title,
  href,
  editing,
  status,
  onRetry,
  children,
}: {
  widget: Widget
  title: string
  href?: string
  editing?: boolean
  status?: CardStatus
  onRetry?: () => void
  children: ReactNode
}) {
  const t = useT("today.dashboard")
  const Icon = WIDGET_ICONS[widget.kind]
  const style: CSSProperties = widget.color
    ? { backgroundColor: widget.color, color: widget.text_color ?? undefined }
    : {}
  const linked = href && !editing
  const body = (
    <>
      <header className="flex items-center gap-1.5 text-xs font-medium">
        <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
        <span className="min-w-0 flex-1 truncate opacity-80">{title}</span>
        {linked ? (
          <span className="flex shrink-0 items-center text-[11px] opacity-70">
            {t("showAll")}
            <Icons.chevronRight aria-hidden className="size-3.5" />
          </span>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain md:overflow-y-auto">
        {status === "loading" ? <CardSkeleton /> : status === "error" ? <CardError onRetry={onRetry} /> : children}
      </div>
    </>
  )
  return (
    <section
      aria-label={title}
      data-widget-id={widget.id}
      data-widget-kind={widget.kind}
      data-widget-size={widget.size}
      data-text-color={widget.text_color ?? undefined}
      style={style}
      className={`bg-card text-card-foreground flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border p-3 shadow-sm ${editing ? "ring-primary/40 ring-2" : ""}`}
    >
      {linked ? (
        <Link
          href={href}
          className="focus-visible:ring-ring flex h-full min-h-0 flex-col gap-2 rounded-2xl outline-none focus-visible:ring-2"
        >
          {body}
        </Link>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">{body}</div>
      )}
    </section>
  )
}

export const WidgetFrame = DashboardCard
