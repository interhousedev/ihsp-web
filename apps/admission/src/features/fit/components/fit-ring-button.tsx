"use client"

import { useT } from "@ihsp/i18n"
import { cn, HoverCard, HoverCardContent, HoverCardTrigger, Icons, ResponsiveDialog } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import type { MetricId, UniFit } from "../fit-model"
import { FitBreakdown } from "./fit-breakdown"
import { FitRing } from "./fit-ring"

/**
 * The ring as a control, without a word of text on it: hover lift and pointer cursor on desktop (a hover card shows
 * the per-segment reasons), a halo pulse and a chevron badge on phones (a tap opens the bottom sheet with the
 * reasons and "what moves it"), a focus ring for the keyboard (Enter opens the sheet).
 */
export function FitRingButton({
  name,
  fit,
  size = 52,
  children,
  className,
}: {
  name: string
  fit: UniFit
  size?: number
  /** The logo. */
  children?: ReactNode
  className?: string
}) {
  const t = useT("fit")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<MetricId | null>(null)
  const total = fit.total
  return (
    <>
      <HoverCard>
        <HoverCardTrigger
          delay={120}
          closeDelay={80}
          render={
            <button
              type="button"
              aria-label={t("open", { name, value: total ?? "—" })}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              className={cn(
                "group focus-visible:ring-ring relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "transition-[transform,filter] duration-200 ease-(--ease-standard) motion-reduce:transition-none",
                "ring-foreground/10 ring-1 hover:scale-110 hover:drop-shadow-md active:scale-95",
                className,
              )}
            />
          }
        >
          <FitRing metrics={fit.metrics} total={fit.total} size={size}>
            {children}
          </FitRing>
          <span
            aria-hidden
            className="fit-cue border-foreground/50 pointer-events-none absolute inset-0 hidden rounded-full border max-md:block pointer-coarse:block"
          />
          <span
            aria-hidden
            className="bg-foreground text-background ring-card pointer-events-none absolute -end-1 -bottom-1 flex size-4 items-center justify-center rounded-full opacity-60 ring-2 transition-opacity group-hover:opacity-100 max-md:opacity-100 pointer-coarse:opacity-100"
          >
            <Icons.chevronUp className="size-3" />
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 max-md:hidden" side="right" align="start" sideOffset={10}>
          <FitBreakdown name={name} fit={fit} onHover={setActive} />
        </HoverCardContent>
      </HoverCard>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("title")} description={name} size="sm">
        <div className="flex items-center gap-4">
          <FitRing metrics={fit.metrics} total={fit.total} size={72} active={active}>
            {children}
          </FitRing>
          <p className="text-muted-foreground text-sm">{t(fit.metrics.length === 0 ? "ringHelpTotal" : "ringHelp")}</p>
        </div>
        <FitBreakdown name={name} fit={fit} full onHover={setActive} />
      </ResponsiveDialog>
    </>
  )
}
