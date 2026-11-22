"use client"

import { cn, Dialog, DialogContent, DialogDescription, DialogTitle, Icons } from "@ihsp/ui"
import type { ReactNode } from "react"

export type BriefSectionSpec = {
  id: string
  /** The muted label above the section's cards. */
  title: string
  content: ReactNode
}

export type BriefPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** The muted line under the title (a date, a count). */
  subtitle?: string
  /** The headline paragraph; wrap the phrases to stress in `BriefEm`. */
  lead?: ReactNode
  sections?: readonly BriefSectionSpec[]
  /** Replaces the lead and the sections: loading, error, consent. */
  state?: ReactNode
  /** The pill of the foot, e.g. "Close" or "Refresh". */
  actions?: ReactNode
  closeLabel: string
}

/** Stressed words of the lead: dark and bold against the muted rest. */
export function BriefEm({ children }: { children: ReactNode }) {
  return <strong className="text-foreground font-semibold">{children}</strong>
}

/**
 * A right-side slide-in "brief": a big title with a muted line under it, a lead paragraph in which the key phrases are
 * stressed, a rule, then labelled sections of white cards, and a pill of actions floating at the foot.
 * The layout follows the morning brief window of moonin.ai, drawn with this app's tokens. Content comes in as props.
 */
export function BriefPanel({
  open,
  onOpenChange,
  title,
  subtitle,
  lead,
  sections = [],
  state,
  actions,
  closeLabel,
}: BriefPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-muted/60 flex h-[min(46rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[34rem] max-sm:h-[92dvh]"
      >
        <div className="flex items-center justify-between px-5 pt-4 md:px-7 md:pt-5">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => onOpenChange(false)}
            className="bg-card text-foreground hover:bg-accent focus-visible:ring-ring flex size-11 items-center justify-center rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none md:size-10"
          >
            <Icons.chevronLeft aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-5 pb-28 md:px-7">
          <header className="flex flex-col gap-1">
            <DialogTitle className="text-3xl leading-tight font-bold tracking-tight md:text-4xl">{title}</DialogTitle>
            {subtitle ? <DialogDescription className="text-base">{subtitle}</DialogDescription> : null}
          </header>
          {state ?? (
            <>
              {lead ? (
                <p className="text-muted-foreground border-border border-b pb-6 text-xl leading-snug md:text-2xl">
                  {lead}
                </p>
              ) : null}
              {sections.map((section) => (
                <BriefSection key={section.id} title={section.title}>
                  {section.content}
                </BriefSection>
              ))}
            </>
          )}
        </div>
        {actions ? (
          <div className="from-muted/0 via-muted/80 to-muted pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-b px-5 pt-8 pb-5 md:px-7">
            <div className="pointer-events-auto flex w-full flex-wrap justify-center gap-2">{actions}</div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** A labelled group of cards. */
export function BriefSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h3 className="text-muted-foreground px-1 text-sm font-medium">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

const STATUS_TONE = {
  danger: "text-destructive",
  warning: "text-warning",
  success: "text-success",
  muted: "text-muted-foreground",
} as const

export type BriefCardProps = {
  title: string
  description?: ReactNode
  /** A coloured line under the description: `Safety · admit 62% (international, 2025)`. */
  status?: { tone: keyof typeof STATUS_TONE; label: string; detail?: string }
  /** The action of the card, e.g. "Add to my list". */
  action?: ReactNode
  /** Other content inside the card, below the status. */
  children?: ReactNode
  className?: string
}

/** One white card: bold title, muted description, a status line and an action. */
export function BriefCard({ title, description, status, action, children, className }: BriefCardProps) {
  return (
    <article className={cn("bg-card flex flex-col gap-2 rounded-3xl p-5 shadow-xs", className)}>
      <h4 className="text-base leading-snug font-semibold">{title}</h4>
      {description ? <p className="text-muted-foreground text-base leading-snug">{description}</p> : null}
      {children}
      {status ? (
        <p className="text-sm font-medium">
          <span className={STATUS_TONE[status.tone]}>{status.label}</span>
          {status.detail ? <span className="text-muted-foreground"> · {status.detail}</span> : null}
        </p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </article>
  )
}

export type BriefBarSegment = {
  key: string
  label: string
  value: number
  tone: "success" | "warning" | "primary" | "muted"
}

const BAR_TONE = {
  success: "bg-success text-success",
  warning: "bg-warning text-warning",
  primary: "bg-primary text-primary",
  muted: "bg-muted-foreground/30 text-muted-foreground",
} as const

/** A segmented bar with a legend of counts under it ("5 Available · 42 Assigned · 3 In shop"). */
export function BriefBar({ title, segments }: { title: string; segments: readonly BriefBarSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  return (
    <article className="bg-card flex flex-col gap-3 rounded-3xl p-5 shadow-xs">
      <h4 className="text-base leading-snug font-semibold">{title}</h4>
      <div role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")} className="flex h-3 gap-1">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.key}
              style={{ flexGrow: segment.value / (total || 1) }}
              className={cn("min-w-3 flex-1 rounded-full", BAR_TONE[segment.tone].split(" ")[0])}
            />
          ))}
        {total === 0 ? <span className="bg-muted flex-1 rounded-full" /> : null}
      </div>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-x-3 gap-y-2 text-sm font-medium">
        {segments.map((segment) => (
          <li key={segment.key} className={cn("flex flex-col", BAR_TONE[segment.tone].split(" ")[1])}>
            <span className="text-lg font-semibold tabular-nums">{segment.value}</span>
            <span>{segment.label}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
